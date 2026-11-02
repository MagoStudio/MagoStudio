import { describe, expect, it } from "vitest";

import {
  INGESTION_TARGET_PROGRESS,
  PROGRESS_ANIMATION_DURATION,
  UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
} from "../constants";

import { getEasedIngestionProgress } from "./getEasedIngestionProgress";

describe("getEasedIngestionProgress", () => {
  it("starts at the post-upload progress floor", () => {
    expect(getEasedIngestionProgress(0)).toBe(
      UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
    );
  });

  it("reaches the ingestion target once the animation duration elapses", () => {
    expect(getEasedIngestionProgress(PROGRESS_ANIMATION_DURATION)).toBe(
      INGESTION_TARGET_PROGRESS
    );
  });

  it("clamps at the ingestion target beyond the animation duration", () => {
    expect(getEasedIngestionProgress(PROGRESS_ANIMATION_DURATION * 10)).toBe(
      INGESTION_TARGET_PROGRESS
    );
  });

  it("treats negative elapsed time as zero", () => {
    expect(getEasedIngestionProgress(-5000)).toBe(
      UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
    );
  });

  it("increases monotonically", () => {
    const samples = [0, 1000, 5000, 30000, 60000, 90000, 120000].map(
      getEasedIngestionProgress
    );

    samples.forEach((value, index) => {
      if (index === 0) return;
      expect(value).toBeGreaterThan(samples[index - 1]);
    });
  });

  it("eases out — the first half covers more ground than the second", () => {
    const halfway = PROGRESS_ANIMATION_DURATION / 2;
    const firstHalfGain =
      getEasedIngestionProgress(halfway) - getEasedIngestionProgress(0);
    const secondHalfGain =
      getEasedIngestionProgress(PROGRESS_ANIMATION_DURATION) -
      getEasedIngestionProgress(halfway);

    expect(firstHalfGain).toBeGreaterThan(secondHalfGain);
  });
});
