import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { waitForPollTick } from "./waitForPollTick";

const TICK_MS = 1000;

describe("waitForPollTick", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves once the interval elapses", async () => {
    const controller = new AbortController();
    let hasResolved = false;

    void waitForPollTick(TICK_MS, controller.signal).then(() => {
      hasResolved = true;
    });

    await vi.advanceTimersByTimeAsync(TICK_MS - 1);
    expect(hasResolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(hasResolved).toBe(true);
  });

  it("resolves immediately when the signal aborts before the interval", async () => {
    const controller = new AbortController();
    let hasResolved = false;

    void waitForPollTick(TICK_MS, controller.signal).then(() => {
      hasResolved = true;
    });

    controller.abort();
    await vi.advanceTimersByTimeAsync(0);

    expect(hasResolved).toBe(true);
  });

  it("detaches its abort listener once settled", async () => {
    const controller = new AbortController();
    const removeEventListener = vi.spyOn(
      controller.signal,
      "removeEventListener"
    );

    await Promise.all([
      waitForPollTick(TICK_MS, controller.signal),
      vi.advanceTimersByTimeAsync(TICK_MS)
    ]);

    expect(removeEventListener).toHaveBeenCalledOnce();
  });
});
