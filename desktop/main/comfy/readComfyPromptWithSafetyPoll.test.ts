import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ComfyLivePrompt } from "./ComfyProgressMonitor";
import { readComfyPromptWithSafetyPoll } from "./readComfyPromptWithSafetyPoll";

const createMonitor = (livePrompt: ComfyLivePrompt | null) => ({
  livePrompt: vi.fn(() => livePrompt),
  resetConnection: vi.fn(),
  forget: vi.fn()
});

const runningPrompt: ComfyLivePrompt = {
  phase: "running",
  runStartedAt: new Date(),
  progressFraction: 0.4
};

describe("readComfyPromptWithSafetyPoll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-29T12:00:00.000Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("trusts a live socket and skips HTTP between safety polls", async () => {
    const monitor = createMonitor(runningPrompt);
    const readOverHttp = vi.fn();

    const { result, statusCheckedAt } = await readComfyPromptWithSafetyPoll({
      monitor,
      promptId: "p1",
      lastStatusCheckAt: Date.now() - 10_000,
      readOverHttp
    });

    expect(result).toEqual({ state: "running" });
    expect(statusCheckedAt).toBeNull();
    expect(readOverHttp).not.toHaveBeenCalled();
  });

  it("checks over HTTP once the 30 second safety poll is due", async () => {
    const monitor = createMonitor(runningPrompt);
    const readOverHttp = vi.fn().mockResolvedValue({ state: "running" });

    const { statusCheckedAt } = await readComfyPromptWithSafetyPoll({
      monitor,
      promptId: "p1",
      lastStatusCheckAt: Date.now() - 30_000,
      readOverHttp
    });

    expect(readOverHttp).toHaveBeenCalledOnce();
    expect(statusCheckedAt).toBe(Date.now());
    expect(monitor.resetConnection).not.toHaveBeenCalled();
  });

  it("resets a silently dead socket when HTTP finds the prompt already finished", async () => {
    const monitor = createMonitor(runningPrompt);
    const readOverHttp = vi.fn().mockResolvedValue({ state: "finished" });

    const { result } = await readComfyPromptWithSafetyPoll({
      monitor,
      promptId: "p1",
      lastStatusCheckAt: Number.NEGATIVE_INFINITY,
      readOverHttp
    });

    expect(result).toEqual({ state: "finished" });
    expect(monitor.resetConnection).toHaveBeenCalledOnce();
    expect(monitor.forget).toHaveBeenCalledWith("p1");
  });

  it("polls over HTTP when the socket cannot vouch for the prompt", async () => {
    const monitor = createMonitor(null);
    const readOverHttp = vi.fn().mockResolvedValue({ state: "queued" });

    const { result } = await readComfyPromptWithSafetyPoll({
      monitor,
      promptId: "p1",
      lastStatusCheckAt: Date.now(),
      readOverHttp
    });

    expect(result).toEqual({ state: "queued" });
    expect(readOverHttp).toHaveBeenCalledOnce();
  });

  it("reads the outcome right away once the socket reports the prompt settled", async () => {
    const monitor = createMonitor({ ...runningPrompt, phase: "settled" });
    const readOverHttp = vi
      .fn()
      .mockResolvedValue({ state: "error", message: "failed" });

    const { result } = await readComfyPromptWithSafetyPoll({
      monitor,
      promptId: "p1",
      lastStatusCheckAt: Date.now(),
      readOverHttp
    });

    expect(result).toEqual({ state: "error", message: "failed" });
    expect(monitor.resetConnection).not.toHaveBeenCalled();
    expect(monitor.forget).toHaveBeenCalledWith("p1");
  });
});
