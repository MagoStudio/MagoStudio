import { describe, expect, it } from "vitest";

import { resolveSettledAssetResults } from "./resolveSettledAssetResults";

describe("resolveSettledAssetResults", () => {
  it("keeps the fulfilled values and maps a rejection to undefined", () => {
    const settledResults: PromiseSettledResult<string>[] = [
      { status: "fulfilled", value: "asset-a" },
      { status: "rejected", reason: new Error("network error") },
      { status: "fulfilled", value: "asset-c" }
    ];

    expect(resolveSettledAssetResults(settledResults)).toEqual([
      "asset-a",
      undefined,
      "asset-c"
    ]);
  });

  it("maps every entry to undefined when everything rejected", () => {
    const settledResults: PromiseSettledResult<string>[] = [
      { status: "rejected", reason: new Error("boom") },
      { status: "rejected", reason: new Error("boom again") }
    ];

    expect(resolveSettledAssetResults(settledResults)).toEqual([
      undefined,
      undefined
    ]);
  });

  it("returns an empty array for an empty batch", () => {
    expect(resolveSettledAssetResults([])).toEqual([]);
  });
});
