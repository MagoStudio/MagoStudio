import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ComfyWebSocket,
  ComfyProgressMonitor
} from "./ComfyProgressMonitor";

type Listener = (event: { data?: unknown }) => void;

class FakeComfyWebSocket implements ComfyWebSocket {
  readyState = 0;
  readonly listeners = new Map<string, Listener[]>();
  isClosed = false;

  constructor(readonly url: string) {}

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  close(): void {
    this.isClosed = true;
  }

  emit(type: string, data?: unknown): void {
    for (const listener of this.listeners.get(type) ?? []) listener({ data });
  }

  open(): void {
    this.readyState = 1;
    this.emit("open");
  }

  send(type: string, data: Record<string, unknown>): void {
    this.emit("message", JSON.stringify({ type, data }));
  }
}

const graph = {
  "1": { class_type: "UNETLoader", inputs: {} },
  "2": { class_type: "KSampler", inputs: { steps: 8 } },
  "3": { class_type: "VAEDecode", inputs: {} }
};

const createMonitor = () => {
  const sockets: FakeComfyWebSocket[] = [];
  const monitor = new ComfyProgressMonitor(
    "http://127.0.0.1:8188",
    "mago-test",
    (url) => {
      const socket = new FakeComfyWebSocket(url);
      sockets.push(socket);
      return socket;
    }
  );
  return { monitor, sockets };
};

describe("ComfyProgressMonitor", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("opens one socket for the process client id only while prompts are watched", () => {
    const { monitor, sockets } = createMonitor();
    expect(sockets).toHaveLength(0);

    monitor.watch("p1", graph);
    monitor.watch("p2", graph);
    expect(sockets).toHaveLength(1);
    expect(sockets[0].url).toBe("ws://127.0.0.1:8188/ws?clientId=mago-test");

    monitor.forget("p1");
    expect(sockets[0].isClosed).toBe(false);
    monitor.forget("p2");
    expect(sockets[0].isClosed).toBe(true);
  });

  it("follows a prompt from start through sampler steps to success", () => {
    const { monitor, sockets } = createMonitor();
    const settled = vi.fn();
    monitor.onPromptSettled(settled);
    monitor.watch("p1", graph);
    sockets[0].open();

    expect(monitor.livePrompt("p1")).toBeNull();

    sockets[0].send("execution_start", { prompt_id: "p1", timestamp: 1000 });
    sockets[0].send("executing", { prompt_id: "p1", node: "1" });
    sockets[0].send("executing", { prompt_id: "p1", node: "2" });
    sockets[0].send("progress", {
      prompt_id: "p1",
      node: "2",
      value: 4,
      max: 8
    });

    expect(monitor.livePrompt("p1")).toEqual({
      phase: "running",
      runStartedAt: new Date(1000),
      progressFraction: 0.5
    });

    sockets[0].send("execution_success", { prompt_id: "p1" });
    expect(monitor.livePrompt("p1")?.phase).toBe("settled");
    expect(settled).toHaveBeenCalledWith("p1");
  });

  it("counts cached nodes as finished", () => {
    const { monitor, sockets } = createMonitor();
    monitor.watch("p1", graph);
    sockets[0].open();

    sockets[0].send("execution_cached", { prompt_id: "p1", nodes: ["1", "2"] });

    expect(monitor.livePrompt("p1")?.progressFraction).toBeCloseTo(0.9);
  });

  it("settles on an execution error or interrupt", () => {
    const { monitor, sockets } = createMonitor();
    monitor.watch("failed", graph);
    monitor.watch("interrupted", graph);
    sockets[0].open();

    sockets[0].send("execution_error", { prompt_id: "failed" });
    sockets[0].send("execution_interrupted", { prompt_id: "interrupted" });

    expect(monitor.livePrompt("failed")?.phase).toBe("settled");
    expect(monitor.livePrompt("interrupted")?.phase).toBe("settled");
  });

  it("trusts a prompt watched on an already-open socket before any event", () => {
    const { monitor, sockets } = createMonitor();
    monitor.watch("earlier", graph);
    sockets[0].open();

    monitor.watch("p1", graph);

    expect(monitor.livePrompt("p1")).toMatchObject({ phase: "queued" });
  });

  it("ignores binary previews, malformed frames and other prompts", () => {
    const { monitor, sockets } = createMonitor();
    monitor.watch("earlier", graph);
    sockets[0].open();
    monitor.watch("p1", graph);

    sockets[0].emit("message", new Uint8Array([1, 2, 3]));
    sockets[0].emit("message", "not json");
    sockets[0].send("status", {
      status: { exec_info: { queue_remaining: 1 } }
    });
    sockets[0].send("progress", { prompt_id: "other", value: 1, max: 2 });

    expect(monitor.livePrompt("p1")).toMatchObject({
      phase: "queued",
      progressFraction: 0
    });
  });

  it("replays events that arrived before the prompt was watched", () => {
    const { monitor, sockets } = createMonitor();
    monitor.watch("earlier", graph);
    sockets[0].open();

    sockets[0].send("execution_start", { prompt_id: "fast", timestamp: 5 });
    sockets[0].send("execution_success", { prompt_id: "fast" });
    monitor.watch("fast", graph);

    expect(monitor.livePrompt("fast")?.phase).toBe("settled");
  });

  it("stops vouching for prompts when the socket drops, then reconnects", () => {
    const { monitor, sockets } = createMonitor();
    monitor.watch("p1", graph);
    sockets[0].open();
    sockets[0].send("execution_start", { prompt_id: "p1" });

    sockets[0].emit("close");
    expect(monitor.livePrompt("p1")).toBeNull();

    vi.advanceTimersByTime(1_000);
    expect(sockets).toHaveLength(2);
    sockets[1].open();
    expect(monitor.livePrompt("p1")).toBeNull();

    sockets[1].send("progress", {
      prompt_id: "p1",
      node: "2",
      value: 1,
      max: 8
    });
    expect(monitor.livePrompt("p1")?.phase).toBe("running");
  });

  it("drops every prompt's tracking and reconnects on reset", () => {
    const { monitor, sockets } = createMonitor();
    monitor.watch("p1", graph);
    sockets[0].open();

    monitor.resetConnection();

    expect(sockets[0].isClosed).toBe(true);
    expect(sockets).toHaveLength(2);
    sockets[1].open();
    expect(monitor.livePrompt("p1")).toBeNull();
  });

  it("resolves a settle wait on the event or after the timeout", async () => {
    const { monitor, sockets } = createMonitor();
    monitor.watch("p1", graph);
    sockets[0].open();

    const onEvent = vi.fn();
    void monitor.waitForSettle("p1", 60_000).then(onEvent);
    sockets[0].send("execution_success", { prompt_id: "p1" });
    await vi.advanceTimersByTimeAsync(0);
    expect(onEvent).toHaveBeenCalled();

    const onTimeout = vi.fn();
    void monitor.waitForSettle("p2", 1_000).then(onTimeout);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(onTimeout).toHaveBeenCalled();
  });
});
