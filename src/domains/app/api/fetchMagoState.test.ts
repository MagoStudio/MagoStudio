import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchMagoState } from "./fetchMagoState";

const respondWith = (response: Partial<Response>) =>
  vi.fn(() => Promise.resolve(response as Response));

const neverRespondUntilAborted = () =>
  vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(init.signal?.reason ?? new Error("aborted"));
        });
      })
  );

const EXPECTED_TIMEOUT_MS = 8000;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchMagoState", () => {
  it("returns the parsed state when the host responds", async () => {
    const state = { "release-ongoing": false, version: "1.2.3" };
    vi.stubGlobal(
      "fetch",
      respondWith({ ok: true, json: () => Promise.resolve(state) })
    );

    await expect(fetchMagoState()).resolves.toEqual(state);
  });

  it("throws when the host answers with a non-ok status", async () => {
    vi.stubGlobal("fetch", respondWith({ ok: false }));

    await expect(fetchMagoState()).rejects.toThrow(
      "Failed to fetch Mago state"
    );
  });

  it("rejects instead of hanging forever when the host never responds", async () => {
    const unresponsiveHostAbort = new AbortController();
    const timeoutSignal = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(unresponsiveHostAbort.signal);
    vi.stubGlobal("fetch", neverRespondUntilAborted());

    const pendingState = fetchMagoState();
    expect(timeoutSignal).toHaveBeenCalledWith(EXPECTED_TIMEOUT_MS);

    const rejection = expect(pendingState).rejects.toThrow("timed out");
    unresponsiveHostAbort.abort(
      new DOMException("The operation timed out.", "TimeoutError")
    );

    await rejection;
  });
});
