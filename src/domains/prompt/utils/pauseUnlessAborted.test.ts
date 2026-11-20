import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pauseUnlessAborted } from "./pauseUnlessAborted";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("pauseUnlessAborted", () => {
  it("resolves after the pause", async () => {
    const pause = pauseUnlessAborted(2000, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(2000);
    await expect(pause).resolves.toBeUndefined();
  });

  it("rejects as soon as the signal aborts", async () => {
    const controller = new AbortController();
    const pause = expect(
      pauseUnlessAborted(2000, controller.signal)
    ).rejects.toBe("stop");
    controller.abort("stop");
    await pause;
  });

  it("rejects at once on an already aborted signal", async () => {
    const controller = new AbortController();
    controller.abort("stop");
    await expect(pauseUnlessAborted(2000, controller.signal)).rejects.toBe(
      "stop"
    );
  });
});
