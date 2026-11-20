import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runCloudScriptChat } from "./runCloudScriptChat";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  ensureMirror: vi.fn()
}));
vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get: mocks.get, post: mocks.post }
}));
vi.mock("@domains/cloud/backendCloudApi", () => ({
  backendCloudApi: () => "cloud-api"
}));
vi.mock("@domains/cloud/ensureCloudMirrorOfLocalProject", () => ({
  ensureCloudMirrorOfLocalProject: mocks.ensureMirror
}));

const writeScript = { name: "write_script", args: { script: "INT. BANK" } };
const tools = [{ function_declarations: [{ name: "write_script" }] }];

const transcript = (...messages: Record<string, unknown>[]) => ({
  data: { messages }
});

const conflict = (inFlightMessageId: string) =>
  new AxiosError("conflict", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 409,
    statusText: "Conflict",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { message_id: inFlightMessageId, status: "PENDING" }
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  mocks.ensureMirror.mockResolvedValue("cloud-project");
});
afterEach(() => vi.useRealTimers());

describe("runCloudScriptChat", () => {
  it("asks the mirrored project's chat and hands back the call it made", async () => {
    mocks.post.mockResolvedValue({ data: { message_id: "reply" } });
    mocks.get
      .mockResolvedValueOnce(transcript({ id: "reply", status: "PENDING" }))
      .mockResolvedValueOnce(
        transcript({
          id: "reply",
          status: "COMPLETED",
          function_call: writeScript,
          function_calls: [writeScript]
        })
      );

    const pending = runCloudScriptChat(
      "local-project",
      { message: "Write it", system_prompt: "You write scripts", tools },
      new AbortController().signal
    );
    await vi.advanceTimersByTimeAsync(4000);

    expect(JSON.parse((await pending).content)).toEqual({
      function_calls: [writeScript]
    });
    expect(mocks.ensureMirror).toHaveBeenCalledWith(
      "cloud-api",
      "local-project"
    );
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith(
      "/chat/message",
      {
        project_id: "cloud-project",
        message: "Write it",
        history_messages: 100,
        system_prompt: "You write scripts",
        tools
      },
      expect.objectContaining({ timeout: 30_000 })
    );
    expect(mocks.get).toHaveBeenCalledWith(
      "/chat/message",
      expect.objectContaining({
        params: { project_id: "cloud-project", limit: 5 }
      })
    );
  });

  it("surfaces a failed cloud reply", async () => {
    mocks.post.mockResolvedValue({ data: { message_id: "reply" } });
    mocks.get.mockResolvedValue(
      transcript({ id: "reply", status: "FAILED", error: "Gemini refused" })
    );

    const result = expect(
      runCloudScriptChat(
        "local",
        { message: "Hi" },
        new AbortController().signal
      )
    ).rejects.toThrow("Gemini refused");
    await vi.advanceTimersByTimeAsync(2000);
    await result;
  });

  it("waits out a reply already in flight, then asks again", async () => {
    mocks.post
      .mockRejectedValueOnce(conflict("earlier"))
      .mockResolvedValueOnce({ data: { message_id: "reply" } });
    mocks.get
      .mockResolvedValueOnce(
        transcript({ id: "earlier", status: "COMPLETED", content: "Old" })
      )
      .mockResolvedValueOnce(
        transcript({ id: "reply", status: "COMPLETED", content: "New" })
      );

    const pending = runCloudScriptChat(
      "local",
      { message: "Hi" },
      new AbortController().signal
    );
    await vi.advanceTimersByTimeAsync(4000);

    expect(JSON.parse((await pending).content)).toEqual({ text: "New" });
    expect(mocks.post).toHaveBeenCalledTimes(2);
  });

  it("refuses an empty message without touching the cloud", async () => {
    await expect(
      runCloudScriptChat(
        "local",
        { message: "  " },
        new AbortController().signal
      )
    ).rejects.toThrow("empty");
    expect(mocks.ensureMirror).not.toHaveBeenCalled();
  });
});
