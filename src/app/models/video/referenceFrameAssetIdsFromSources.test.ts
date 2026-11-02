import { SourceImage } from "@domains/renders/types";
import { describe, expect, it } from "vitest";

import { referenceFrameAssetIdsFromSources } from "./referenceFrameAssetIdsFromSources";

describe("referenceFrameAssetIdsFromSources", () => {
  it("maps reference_frame entries to their asset ids in order", () => {
    const sources: SourceImage[] = [
      { asset_id: "a", type: "reference_frame" },
      { asset_id: "b", type: "reference_frame" }
    ];
    expect(referenceFrameAssetIdsFromSources(sources)).toEqual(["a", "b"]);
  });

  it("ignores non-reference_frame entries", () => {
    const sources: SourceImage[] = [
      { asset_id: "m", type: "motion_reference" },
      { asset_id: "a", type: "reference_frame" }
    ];
    expect(referenceFrameAssetIdsFromSources(sources)).toEqual(["a"]);
  });

  it("drops entries with an empty asset_id", () => {
    const sources: SourceImage[] = [
      { asset_id: "", type: "reference_frame" },
      { asset_id: "a", type: "reference_frame" }
    ];
    expect(referenceFrameAssetIdsFromSources(sources)).toEqual(["a"]);
  });

  it("returns [] for an empty sources list", () => {
    expect(referenceFrameAssetIdsFromSources([])).toEqual([]);
  });
});
