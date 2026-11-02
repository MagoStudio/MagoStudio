import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ComfyStatus } from "../../../../../desktop/shared/contracts";

import { waitForComfyToRespond } from "./waitForComfyToRespond";

const comfyStatus = (available: boolean) => ({ available }) as ComfyStatus;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("waitForComfyToRespond", () => {
  it("checks right away and resolves when ComfyUI already responds", async () => {
    const checkComfyStatus = vi.fn().mockResolvedValue(comfyStatus(true));
    await expect(waitForComfyToRespond({ checkComfyStatus })).resolves.toEqual({
      outcome: "responded",
      comfyStatus: comfyStatus(true)
    });
    expect(checkComfyStatus).toHaveBeenCalledOnce();
  });

  it("checks every 10 seconds until ComfyUI responds", async () => {
    const checkComfyStatus = vi
      .fn()
      .mockResolvedValueOnce(comfyStatus(false))
      .mockResolvedValueOnce(comfyStatus(false))
      .mockResolvedValue(comfyStatus(true));
    const onCheck = vi.fn();
    const wait = waitForComfyToRespond({ checkComfyStatus, onCheck });
    await vi.advanceTimersByTimeAsync(9_999);
    expect(checkComfyStatus).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(10_001);
    await expect(wait).resolves.toMatchObject({ outcome: "responded" });
    expect(checkComfyStatus).toHaveBeenCalledTimes(3);
    expect(onCheck.mock.calls).toEqual([[1], [2], [3]]);
  });

  it("times out after 5 minutes with a final check at the deadline", async () => {
    const checkComfyStatus = vi.fn().mockResolvedValue(comfyStatus(false));
    const wait = waitForComfyToRespond({ checkComfyStatus });
    await vi.advanceTimersByTimeAsync(299_999);
    expect(checkComfyStatus).toHaveBeenCalledTimes(30);
    await vi.advanceTimersByTimeAsync(1);
    await expect(wait).resolves.toEqual({ outcome: "timed-out" });
    expect(checkComfyStatus).toHaveBeenCalledTimes(31);
  });

  it("counts the timeout from when the launch started", async () => {
    const checkComfyStatus = vi.fn().mockResolvedValue(comfyStatus(false));
    const wait = waitForComfyToRespond({
      checkComfyStatus,
      launchStartedAtMs: Date.now() - 295_000
    });
    await vi.advanceTimersByTimeAsync(5_000);
    await expect(wait).resolves.toEqual({ outcome: "timed-out" });
    expect(checkComfyStatus).toHaveBeenCalledTimes(2);
  });

  it("stops checking once the launched process has exited", async () => {
    const checkComfyStatus = vi
      .fn()
      .mockResolvedValueOnce({
        available: false,
        launchedProcess: { status: "running" }
      })
      .mockResolvedValue({
        available: false,
        launchedProcess: {
          status: "exited",
          exitCode: 1,
          reportedFailureReason: "No CUDA GPUs are available"
        }
      });
    const wait = waitForComfyToRespond({ checkComfyStatus });
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(wait).resolves.toEqual({
      outcome: "launched-process-exited",
      exitCode: 1,
      reportedFailureReason: "No CUDA GPUs are available"
    });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(checkComfyStatus).toHaveBeenCalledTimes(2);
  });

  it("keeps checking when a check fails", async () => {
    const checkComfyStatus = vi
      .fn()
      .mockRejectedValueOnce(new Error("Error invoking remote method"))
      .mockResolvedValue(comfyStatus(true));
    const wait = waitForComfyToRespond({ checkComfyStatus });
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(wait).resolves.toMatchObject({ outcome: "responded" });
    expect(checkComfyStatus).toHaveBeenCalledTimes(2);
  });

  it("stops checking when cancelled", async () => {
    const checkComfyStatus = vi.fn().mockResolvedValue(comfyStatus(false));
    const cancellation = new AbortController();
    const wait = waitForComfyToRespond({
      checkComfyStatus,
      signal: cancellation.signal
    });
    await vi.advanceTimersByTimeAsync(5_000);
    cancellation.abort();
    await expect(wait).resolves.toEqual({ outcome: "cancelled" });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(checkComfyStatus).toHaveBeenCalledOnce();
  });
});
