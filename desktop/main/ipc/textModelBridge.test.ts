import { EventEmitter } from "node:events";

import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { IPC_CHANNELS } from "../../shared/contracts";

import { TextModelBridge } from "./textModelBridge";

const mocks = vi.hoisted(() => ({
  handlers: new Map<string, (...args: any[]) => void>(),
  trusted: vi.fn()
}));
vi.mock("electron", () => ({
  ipcMain: {
    on: (name: string, handler: (...args: any[]) => void) =>
      mocks.handlers.set(name, handler)
  }
}));
vi.mock("./trustedSender", () => ({ requireTrustedSender: mocks.trusted }));

const setup = () => {
  const sender = Object.assign(new EventEmitter(), {
    send: vi.fn(),
    isDestroyed: () => false
  });
  const bridge = new TextModelBridge();
  bridge.register();
  mocks.handlers.get(IPC_CHANNELS.textModelReady)!({ sender });
  return { bridge, sender };
};
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  mocks.handlers.clear();
});

it("accepts only the requesting renderer's response, including the local route", async () => {
  const { bridge, sender } = setup();
  const pending = bridge.run("casting", { script: "Story" });
  const request = sender.send.mock.calls[0]![1];
  const respond = mocks.handlers.get(IPC_CHANNELS.textModelResponse)!;
  respond({ sender: {} }, { id: request.id, result: { casting: {} } });
  respond({ sender }, { id: request.id, result: null });
  expect(await pending).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});

it("cancels waiting and ignores late replies", async () => {
  const { bridge, sender } = setup();
  let cancelled = false;
  const result = expect(
    bridge.run("video-prompt", {}, () => cancelled)
  ).rejects.toThrow("cancelled");
  const request = sender.send.mock.calls[0]![1];
  cancelled = true;
  await vi.advanceTimersByTimeAsync(250);
  await result;
  expect(sender.send).toHaveBeenCalledWith(
    IPC_CHANNELS.textModelCancel,
    request.id
  );
  mocks.handlers.get(IPC_CHANNELS.textModelResponse)!(
    { sender },
    { id: request.id, result: { prompt: "late" } }
  );
  expect(vi.getTimerCount()).toBe(0);
});

it("fails pending work when its window closes", async () => {
  const { bridge, sender } = setup();
  const result = expect(bridge.run("chat", {})).rejects.toThrow(
    "connection closed"
  );
  sender.emit("destroyed");
  await result;
  expect(vi.getTimerCount()).toBe(0);
});
