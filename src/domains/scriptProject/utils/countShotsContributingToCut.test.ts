import { CutShot } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import {
  countShotsContributingToCut,
  countShotsPinnedAsFinal,
  doesShotContributeToCut,
  isShotPinnedAsFinal
} from "./countShotsContributingToCut";

const cutShot = (
  sequenceId: number,
  assetId: string | null,
  pinnedAssetId: string | null = null
): CutShot => ({
  timeline_id: `timeline-${sequenceId}`,
  shot_index: sequenceId - 1,
  sequence_id: sequenceId,
  heading: null,
  asset_id: assetId,
  pinned_asset_id: pinnedAssetId,
  version_name: assetId ? `shot${sequenceId}_v1` : null,
  is_upscale: false,
  url: null,
  poster_url: null,
  versions: []
});

describe("doesShotContributeToCut", () => {
  it("is true when the shot has a version the cut would carry", () => {
    expect(doesShotContributeToCut(cutShot(2, "asset-1"))).toBe(true);
  });

  it("is false when the shot has nothing rendered", () => {
    expect(doesShotContributeToCut(cutShot(2, null))).toBe(false);
  });

  it("is false for a shot the cut does not list at all", () => {
    expect(doesShotContributeToCut(undefined)).toBe(false);
  });
});

describe("countShotsContributingToCut", () => {
  it("counts only the shots with a contributing version", () => {
    expect(
      countShotsContributingToCut([
        cutShot(2, "asset-1"),
        cutShot(3, null),
        cutShot(4, "asset-2")
      ])
    ).toBe(2);
  });

  it("is zero for an empty cut", () => {
    expect(countShotsContributingToCut([])).toBe(0);
  });
});

describe("isShotPinnedAsFinal", () => {
  it("is true only when the user pinned a version", () => {
    expect(isShotPinnedAsFinal(cutShot(2, "asset-1", "asset-1"))).toBe(true);
  });

  it("is false when the cut fell back to the newest finished render", () => {
    expect(isShotPinnedAsFinal(cutShot(2, "asset-1"))).toBe(false);
  });

  it("is false for a shot with nothing rendered", () => {
    expect(isShotPinnedAsFinal(cutShot(2, null))).toBe(false);
  });
});

describe("countShotsPinnedAsFinal", () => {
  it("counts only the shots the user pinned, not the fallbacks", () => {
    expect(
      countShotsPinnedAsFinal([
        cutShot(2, "asset-1", "asset-1"),
        cutShot(3, "asset-2"),
        cutShot(4, null)
      ])
    ).toBe(1);
  });
});
