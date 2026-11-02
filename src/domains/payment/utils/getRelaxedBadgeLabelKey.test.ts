import { RelaxedModeType } from "@schemas/balance";
import { describe, expect, it } from "vitest";

import { getRelaxedBadgeLabelKey } from "./getRelaxedBadgeLabelKey";

describe("getRelaxedBadgeLabelKey", () => {
  it("returns the Relaxed key for Pro's relaxed mode", () => {
    expect(getRelaxedBadgeLabelKey(RelaxedModeType.RELAXED)).toBe(
      "titles.relaxed_mode.label"
    );
  });

  it("returns null for Studio's unlimited mode (no badge)", () => {
    expect(getRelaxedBadgeLabelKey(RelaxedModeType.UNLIMITED)).toBeNull();
  });

  it("returns null when no relaxed plan (null)", () => {
    expect(getRelaxedBadgeLabelKey(null)).toBeNull();
  });

  it("returns null when undefined", () => {
    expect(getRelaxedBadgeLabelKey(undefined)).toBeNull();
  });
});
