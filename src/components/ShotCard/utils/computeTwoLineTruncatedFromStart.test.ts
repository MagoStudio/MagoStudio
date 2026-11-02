import { describe, expect, it } from "vitest";

import { computeTwoLineTruncatedFromStart } from "./computeTwoLineTruncatedFromStart";

function fitsWithinBudget(budgetCharacters: number) {
  return (candidate: string) => candidate.length <= budgetCharacters;
}

describe("computeTwoLineTruncatedFromStart", () => {
  it("returns the name unchanged when it already fits", () => {
    const result = computeTwoLineTruncatedFromStart(
      "v020",
      fitsWithinBudget(20)
    );
    expect(result).toBe("v020");
  });

  it("returns the name unchanged at exactly the fit boundary", () => {
    const name = "exactly_twenty_chars";
    expect(name).toHaveLength(20);
    const result = computeTwoLineTruncatedFromStart(name, fitsWithinBudget(20));
    expect(result).toBe(name);
  });

  it("truncates from the start with a leading ellipsis once it overflows", () => {
    const result = computeTwoLineTruncatedFromStart(
      "MRSFAB_ep103_sq0160_sh1440_anim_v020",
      fitsWithinBudget(20)
    );
    expect(result.startsWith("…")).toBe(true);
    expect(result.endsWith("anim_v020")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it("keeps the final characters of the name, not the first", () => {
    const result = computeTwoLineTruncatedFromStart(
      "MRSFAB_ep103_sq0160_sh1440_anim_v020",
      fitsWithinBudget(20)
    );
    expect(result).not.toContain("MRSFAB");
  });

  it("maximizes the visible suffix within the available budget", () => {
    const result = computeTwoLineTruncatedFromStart(
      "0123456789",
      fitsWithinBudget(5)
    );
    expect(result).toBe("…6789");
  });

  it("falls back to a bare ellipsis when nothing else fits", () => {
    const result = computeTwoLineTruncatedFromStart(
      "0123456789",
      fitsWithinBudget(0)
    );
    expect(result).toBe("…");
  });

  it("handles an empty name", () => {
    const result = computeTwoLineTruncatedFromStart("", fitsWithinBudget(20));
    expect(result).toBe("");
  });
});
