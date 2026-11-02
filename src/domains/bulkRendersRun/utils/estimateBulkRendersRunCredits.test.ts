import { describe, expect, it } from "vitest";

import { estimateBulkRendersRunCredits } from "./estimateBulkRendersRunCredits";

describe("estimateBulkRendersRunCredits", () => {
  it("returns 0 when no Shot is selected", () => {
    expect(
      estimateBulkRendersRunCredits({
        imageCreditsByShotId: {},
        videoCreditsByShotId: {},
        selectedShotIds: [],
        shotIdsWithUploadedFirstFrame: new Set()
      })
    ).toBe(0);
  });

  it("adds the image and video cost for a single Shot", () => {
    expect(
      estimateBulkRendersRunCredits({
        imageCreditsByShotId: { "shot-1": 50 },
        videoCreditsByShotId: { "shot-1": 420 },
        selectedShotIds: ["shot-1"],
        shotIdsWithUploadedFirstFrame: new Set()
      })
    ).toBe(470);
  });

  it("sums per-Shot image costs when Shots use different image models", () => {
    expect(
      estimateBulkRendersRunCredits({
        imageCreditsByShotId: { "shot-1": 50, "shot-2": 190 },
        videoCreditsByShotId: { "shot-1": 100, "shot-2": 100 },
        selectedShotIds: ["shot-1", "shot-2"],
        shotIdsWithUploadedFirstFrame: new Set()
      })
    ).toBe(440);
  });

  it("sums per-Shot video costs when Shots use different video models", () => {
    expect(
      estimateBulkRendersRunCredits({
        imageCreditsByShotId: {},
        videoCreditsByShotId: { "shot-1": 100, "shot-2": 400 },
        selectedShotIds: ["shot-1", "shot-2"],
        shotIdsWithUploadedFirstFrame: new Set()
      })
    ).toBe(500);
  });

  it("treats a Shot with no recorded image or video cost as 0 credits", () => {
    expect(
      estimateBulkRendersRunCredits({
        imageCreditsByShotId: {},
        videoCreditsByShotId: {},
        selectedShotIds: ["shot-1", "shot-2"],
        shotIdsWithUploadedFirstFrame: new Set()
      })
    ).toBe(0);
  });

  it("rounds each Shot's image and video cost up independently", () => {
    expect(
      estimateBulkRendersRunCredits({
        imageCreditsByShotId: { "shot-1": 0.2, "shot-2": 0.2 },
        videoCreditsByShotId: { "shot-1": 0.2, "shot-2": 0.2 },
        selectedShotIds: ["shot-1", "shot-2"],
        shotIdsWithUploadedFirstFrame: new Set()
      })
    ).toBe(4);
  });

  it("ignores a cost recorded for a Shot that is not selected", () => {
    expect(
      estimateBulkRendersRunCredits({
        imageCreditsByShotId: { "shot-1": 50, "shot-9": 999 },
        videoCreditsByShotId: { "shot-1": 0, "shot-9": 999 },
        selectedShotIds: ["shot-1"],
        shotIdsWithUploadedFirstFrame: new Set()
      })
    ).toBe(50);
  });

  it("omits image cost for a Shot carrying an uploaded first frame", () => {
    expect(
      estimateBulkRendersRunCredits({
        imageCreditsByShotId: { "shot-1": 50 },
        videoCreditsByShotId: { "shot-1": 420 },
        selectedShotIds: ["shot-1"],
        shotIdsWithUploadedFirstFrame: new Set(["shot-1"])
      })
    ).toBe(420);
  });

  it("mixed run: an uploaded Shot contributes video cost only, a generated Shot still contributes both", () => {
    expect(
      estimateBulkRendersRunCredits({
        imageCreditsByShotId: { "shot-uploaded": 40, "shot-generated": 40 },
        videoCreditsByShotId: { "shot-uploaded": 500, "shot-generated": 500 },
        selectedShotIds: ["shot-uploaded", "shot-generated"],
        shotIdsWithUploadedFirstFrame: new Set(["shot-uploaded"])
      })
    ).toBe(1040);
  });

  it("ignores an uploaded-first-frame Shot id that is not selected", () => {
    expect(
      estimateBulkRendersRunCredits({
        imageCreditsByShotId: { "shot-1": 50 },
        videoCreditsByShotId: { "shot-1": 100 },
        selectedShotIds: ["shot-1"],
        shotIdsWithUploadedFirstFrame: new Set(["shot-9"])
      })
    ).toBe(150);
  });
});
