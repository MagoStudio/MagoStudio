import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runCloudTextModel } from "./runCloudTextModel";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  settings: vi.fn(),
  active: vi.fn(),
  preferences: vi.fn()
}));
vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get: mocks.get, post: mocks.post }
}));
vi.mock("@/platform/localDesktop", () => ({
  getLocalDesktopApi: () => ({ comfy: { get: mocks.settings } })
}));
vi.mock("@/platform/cloudAccount", () => ({
  isCloudAccountActive: mocks.active
}));
vi.mock("@/platform/providerPreferences", () => ({
  readProviderPreferences: mocks.preferences
}));

const request = {
  id: "request",
  operation: "casting" as const,
  body: { script: "A story", atomic_shots: true }
};
const run = (input = request, signal = new AbortController().signal) =>
  runCloudTextModel(input, signal);

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  mocks.settings.mockResolvedValue({ textModelProvider: "cloud" });
  mocks.active.mockReturnValue(true);
  mocks.preferences.mockReturnValue({ "mago-cloud": true });
});
afterEach(() => vi.useRealTimers());

describe("desktop cloud text routing", () => {
  it.each(["signed-out", "local-setting"])(
    "uses local without any network for %s",
    async (reason) => {
      if (reason === "signed-out") mocks.active.mockReturnValue(false);
      if (reason === "local-setting")
        mocks.settings.mockResolvedValue({ textModelProvider: "local" });
      expect(await run()).toBeNull();
      expect(mocks.post).not.toHaveBeenCalled();
      expect(mocks.get).not.toHaveBeenCalled();
    }
  );

  it("ignores retired provider switches and polls casting through completion", async () => {
    mocks.preferences.mockReturnValue({ "mago-cloud": false });
    mocks.post.mockResolvedValue({
      status: 202,
      data: { job_id: "job", status: "PENDING" }
    });
    mocks.get
      .mockResolvedValueOnce({ data: { status: "PENDING" } })
      .mockResolvedValueOnce({
        data: {
          status: "COMPLETED",
          casting: { title: "A story" },
          model: "gemini"
        }
      });
    const pending = run();
    await vi.advanceTimersByTimeAsync(4000);
    expect(await pending).toEqual({
      casting: { title: "A story" },
      model: "gemini"
    });
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith(
      "/script/casting?async=true",
      request.body,
      expect.objectContaining({ timeout: 30_000 })
    );
    expect(mocks.get).toHaveBeenCalledWith(
      "/script/casting/jobs/job",
      expect.any(Object)
    );
  });

  it("keeps a completed video fallback and its metadata", async () => {
    mocks.post.mockResolvedValue({
      status: 202,
      data: { job_id: "video", status: "PENDING" }
    });
    const result = {
      prompt: "A cinematic shot",
      prompt_template: "template",
      fallback: true,
      warnings: ["fallback"],
      version: "minimax_h3_ref"
    };
    mocks.get.mockResolvedValue({ data: { status: "COMPLETED", ...result } });
    const pending = runCloudTextModel(
      {
        ...request,
        operation: "video-prompt",
        body: { shot: { action: "Run" }, prompt_version: "minimax_h3_ref" }
      },
      new AbortController().signal
    );
    await vi.advanceTimersByTimeAsync(2000);
    expect(await pending).toEqual(result);
    expect(mocks.get).toHaveBeenCalledWith(
      "/chat/video-prompt/jobs/video",
      expect.any(Object)
    );
  });

  it("surfaces HTTP 200 balance errors without polling or changing route", async () => {
    mocks.post.mockResolvedValue({
      status: 200,
      data: { error: "Insufficient balance and no active subscription" }
    });
    await expect(run()).rejects.toThrow("Insufficient balance");
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it.each(["failed", "missing", "malformed"])(
    "rejects a %s job",
    async (reason) => {
      mocks.post.mockResolvedValue({
        status: 202,
        data: { job_id: "job", status: "PENDING" }
      });
      if (reason === "missing") mocks.get.mockRejectedValue(new Error("404"));
      else
        mocks.get.mockResolvedValue({
          data:
            reason === "failed"
              ? {
                  status: "FAILED",
                  error: { stage: "orphaned", message: "Worker stopped" }
                }
              : { status: "COMPLETED" }
        });
      const result = expect(run()).rejects.toThrow();
      await vi.advanceTimersByTimeAsync(2000);
      await result;
    }
  );

  it("stops polling when cancelled", async () => {
    mocks.post.mockResolvedValue({
      status: 202,
      data: { job_id: "job", status: "PENDING" }
    });
    mocks.get.mockResolvedValue({ data: { status: "PENDING" } });
    const controller = new AbortController();
    const result = expect(run(request, controller.signal)).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(2000);
    controller.abort();
    await result;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  it("bounds endless pending jobs", async () => {
    mocks.post.mockResolvedValue({
      status: 202,
      data: { job_id: "job", status: "PENDING" }
    });
    mocks.get.mockResolvedValue({ data: { status: "PENDING" } });
    const result = expect(run()).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(332_000);
    await result;
  });

  it("runs chat without creating or looking up a cloud project", async () => {
    mocks.post.mockResolvedValue({ data: { content: '{"text":"Hello"}' } });
    expect(
      await runCloudTextModel(
        {
          ...request,
          operation: "chat",
          body: { prompt: "Local history and tool declarations" }
        },
        new AbortController().signal
      )
    ).toEqual({ content: '{"text":"Hello"}' });
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith(
      "/chat/completionv3",
      { apiRequestData: { userInput: "Local history and tool declarations" } },
      expect.any(Object)
    );
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
