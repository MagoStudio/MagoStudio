import { describe, expect, it } from "vitest";

import { parseSceneShotDraftSeconds } from "./parseSceneShotDraftSeconds";

describe("parseSceneShotDraftSeconds", () => {
  it("reads a positive number of seconds", () => {
    expect(parseSceneShotDraftSeconds(" 2.5 ")).toBe(2.5);
  });

  it("reads nothing from an empty, zero or non-numeric field", () => {
    expect(parseSceneShotDraftSeconds("")).toBeUndefined();
    expect(parseSceneShotDraftSeconds("0")).toBeUndefined();
    expect(parseSceneShotDraftSeconds("abc")).toBeUndefined();
  });
});
