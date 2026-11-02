import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { composeAbortSignals, isTimeoutAbort } from "./composeAbortSignals";

const TIMEOUT_MS = 1000;

describe("composeAbortSignals", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not abort while neither source fires", () => {
    const { signal, release } = composeAbortSignals(undefined, TIMEOUT_MS);

    vi.advanceTimersByTime(TIMEOUT_MS - 1);

    expect(signal.aborted).toBe(false);
    release();
  });

  it("aborts with a TimeoutError once the timeout elapses", () => {
    const { signal, release } = composeAbortSignals(undefined, TIMEOUT_MS);

    vi.advanceTimersByTime(TIMEOUT_MS);

    expect(signal.aborted).toBe(true);
    expect(isTimeoutAbort(signal)).toBe(true);
    release();
  });

  it("aborts when the caller signal fires first, preserving its reason", () => {
    const callerController = new AbortController();
    const { signal, release } = composeAbortSignals(
      callerController.signal,
      TIMEOUT_MS
    );

    callerController.abort("user cancelled");

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe("user cancelled");
    expect(isTimeoutAbort(signal)).toBe(false);
    release();
  });

  it("aborts immediately when the caller signal is already aborted", () => {
    const callerController = new AbortController();
    callerController.abort("already gone");

    const { signal, release } = composeAbortSignals(
      callerController.signal,
      TIMEOUT_MS
    );

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe("already gone");
    release();
  });

  it("keeps the first reason when the caller aborts after the timeout", () => {
    const callerController = new AbortController();
    const { signal, release } = composeAbortSignals(
      callerController.signal,
      TIMEOUT_MS
    );

    vi.advanceTimersByTime(TIMEOUT_MS);
    callerController.abort("late cancel");

    expect(isTimeoutAbort(signal)).toBe(true);
    release();
  });

  it("release stops the timeout from ever firing", () => {
    const { signal, release } = composeAbortSignals(undefined, TIMEOUT_MS);

    release();
    vi.advanceTimersByTime(TIMEOUT_MS * 10);

    expect(signal.aborted).toBe(false);
  });

  it("release detaches the caller listener", () => {
    const callerController = new AbortController();
    const removeEventListener = vi.spyOn(
      callerController.signal,
      "removeEventListener"
    );

    const { release } = composeAbortSignals(
      callerController.signal,
      TIMEOUT_MS
    );
    release();

    expect(removeEventListener).toHaveBeenCalledOnce();
  });
});

describe("isTimeoutAbort", () => {
  it("is false for a signal that has not aborted", () => {
    expect(isTimeoutAbort(new AbortController().signal)).toBe(false);
  });
});
