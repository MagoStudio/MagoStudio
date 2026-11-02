import { SourceImage } from "@domains/renders/types";
import { describe, expect, it } from "vitest";

import { promoteKeyFrameToReferenceFrame } from "./promoteKeyFrameToReferenceFrame";

describe("promoteKeyFrameToReferenceFrame", () => {
  it("converts a singleton key_frame to reference_frame and drops the index", () => {
    const input: SourceImage[] = [
      { asset_id: "kf-uuid", type: "key_frame", index: 3 }
    ];
    expect(promoteKeyFrameToReferenceFrame(input)).toEqual([
      { asset_id: "kf-uuid", type: "reference_frame" }
    ]);
  });

  it("is a no-op for a singleton reference_frame", () => {
    const input: SourceImage[] = [{ asset_id: "ref", type: "reference_frame" }];
    expect(promoteKeyFrameToReferenceFrame(input)).toBe(input);
  });

  it("is a no-op for an empty source list", () => {
    const input: SourceImage[] = [];
    expect(promoteKeyFrameToReferenceFrame(input)).toBe(input);
  });

  it("is a no-op for a multi-entry list", () => {
    const input: SourceImage[] = [
      { asset_id: "kf", type: "key_frame", index: 0 },
      { asset_id: "ref", type: "reference_frame" }
    ];
    expect(promoteKeyFrameToReferenceFrame(input)).toBe(input);
  });

  it("promotes the lone key_frame while ignoring non-slot element entries", () => {
    const input: SourceImage[] = [
      { asset_id: "kf", type: "key_frame", index: 3 },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];
    expect(promoteKeyFrameToReferenceFrame(input)).toEqual([
      { asset_id: "kf", type: "reference_frame" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ]);
  });

  it("promotes the lone key_frame while ignoring a style_reference entry", () => {
    const input: SourceImage[] = [
      { asset_id: "s", type: "style_reference" },
      { asset_id: "kf", type: "key_frame", index: 0 }
    ];
    expect(promoteKeyFrameToReferenceFrame(input)).toEqual([
      { asset_id: "s", type: "style_reference" },
      { asset_id: "kf", type: "reference_frame" }
    ]);
  });
});
