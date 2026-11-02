import { describe, expect, it } from "vitest";

import { UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING } from "../constants";

import { getTransferProgress } from "./getTransferProgress";

describe("getTransferProgress", () => {
  it("maps a finished transfer onto the end of the transfer band", () => {
    expect(getTransferProgress(100)).toBe(
      UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
    );
  });

  it("maps an untouched transfer to zero", () => {
    expect(getTransferProgress(0)).toBe(0);
  });

  it("rounds a half-way transfer", () => {
    expect(getTransferProgress(50)).toBe(
      Math.round(UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING / 2)
    );
  });

  it("clamps the -1 sentinel axios emits for a non-computable length", () => {
    expect(getTransferProgress(-1)).toBe(0);
    expect(Object.is(getTransferProgress(-1), -0)).toBe(false);
  });

  it("clamps a percentage above 100", () => {
    expect(getTransferProgress(140)).toBe(
      UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
    );
  });

  it("never leaves the transfer band", () => {
    [-50, -1, 0, 1, 33, 67, 99, 100, 250].forEach((percent) => {
      const progress = getTransferProgress(percent);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(
        UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
      );
    });
  });

  it("increases monotonically across the band", () => {
    const samples = [0, 10, 25, 50, 75, 90, 100].map(getTransferProgress);

    samples.forEach((value, index) => {
      if (index === 0) return;
      expect(value).toBeGreaterThanOrEqual(samples[index - 1]);
    });
  });
});
