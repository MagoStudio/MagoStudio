import { SourceImage } from "@domains/renders/types";
import { describe, expect, it } from "vitest";

import { promoteReferenceFrameToKeyFrame } from "./promoteReferenceFrameToKeyFrame";

describe("promoteReferenceFrameToKeyFrame", () => {
  it("promotes a singleton reference_frame to key_frame with index 0 by default", () => {
    const input: SourceImage[] = [
      { asset_id: "char-uuid", type: "reference_frame" }
    ];
    expect(promoteReferenceFrameToKeyFrame(input)).toEqual([
      { asset_id: "char-uuid", type: "key_frame", index: 0 }
    ]);
  });

  it("respects an explicit keyFrameIndex", () => {
    const input: SourceImage[] = [
      { asset_id: "char-uuid", type: "reference_frame" }
    ];
    expect(promoteReferenceFrameToKeyFrame(input, 7)).toEqual([
      { asset_id: "char-uuid", type: "key_frame", index: 7 }
    ]);
  });

  it("is a no-op for a singleton key_frame", () => {
    const input: SourceImage[] = [
      { asset_id: "kf", type: "key_frame", index: 3 }
    ];
    expect(promoteReferenceFrameToKeyFrame(input)).toBe(input);
  });

  it("is a no-op for an empty source list", () => {
    const input: SourceImage[] = [];
    expect(promoteReferenceFrameToKeyFrame(input)).toBe(input);
  });

  it("is a no-op for a multi-entry list (leaves V3.4+ / V5 source lists untouched)", () => {
    const input: SourceImage[] = [
      { asset_id: "ref", type: "reference_frame" },
      { asset_id: "kf", type: "key_frame", index: 0 }
    ];
    expect(promoteReferenceFrameToKeyFrame(input)).toBe(input);
  });

  it("promotes the lone reference_frame while ignoring non-slot element entries", () => {
    const input: SourceImage[] = [
      { asset_id: "ref", type: "reference_frame" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];
    expect(promoteReferenceFrameToKeyFrame(input)).toEqual([
      { asset_id: "ref", type: "key_frame", index: 0 },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ]);
  });

  it("promotes the lone reference_frame while ignoring a motion_reference entry", () => {
    const input: SourceImage[] = [
      { asset_id: "m", type: "motion_reference" },
      { asset_id: "ref", type: "reference_frame" }
    ];
    expect(promoteReferenceFrameToKeyFrame(input)).toEqual([
      { asset_id: "m", type: "motion_reference" },
      { asset_id: "ref", type: "key_frame", index: 0 }
    ]);
  });

  it("is a no-op when two slot-role entries coexist alongside non-slot roles", () => {
    const input: SourceImage[] = [
      { asset_id: "a", type: "reference_frame" },
      { asset_id: "b", type: "reference_frame" },
      { asset_id: "s", type: "style_reference" }
    ];
    expect(promoteReferenceFrameToKeyFrame(input)).toBe(input);
  });
});
