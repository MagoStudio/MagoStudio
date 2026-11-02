import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  markPastDueModalShownThisSession,
  wasPastDueModalShownThisSession
} from "./pastDueModalShownThisSession";

describe("pastDueModalShownThisSession", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("reports not shown before anything marks it", () => {
    expect(wasPastDueModalShownThisSession()).toBe(false);
  });

  it("reports shown once marked", () => {
    markPastDueModalShownThisSession();

    expect(wasPastDueModalShownThisSession()).toBe(true);
  });

  it("treats any value other than the literal true as not shown", () => {
    sessionStorage.setItem("pastDueModalShown", "1");

    expect(wasPastDueModalShownThisSession()).toBe(false);
  });

  it("reports not shown when reading storage throws", () => {
    vi.spyOn(sessionStorage, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(wasPastDueModalShownThisSession()).toBe(false);
  });

  it("does not throw when writing storage throws", () => {
    vi.spyOn(sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(() => markPastDueModalShownThisSession()).not.toThrow();
  });
});
