import { SourceImage } from "@domains/renders/types";
import { describe, expect, it } from "vitest";

import { promoteReferenceFrameToMotionReference } from "./promoteReferenceFrameToMotionReference";

describe("promoteReferenceFrameToMotionReference", () => {
  it("promotes a singleton reference_frame to motion_reference", () => {
    const input: SourceImage[] = [
      { asset_id: "char-uuid", type: "reference_frame" }
    ];
    expect(promoteReferenceFrameToMotionReference(input)).toEqual([
      { asset_id: "char-uuid", type: "motion_reference" }
    ]);
  });

  it("is a no-op for a singleton motion_reference", () => {
    const input: SourceImage[] = [
      { asset_id: "char-uuid", type: "motion_reference" }
    ];
    expect(promoteReferenceFrameToMotionReference(input)).toBe(input);
  });

  it("is a no-op for an empty source list", () => {
    const input: SourceImage[] = [];
    expect(promoteReferenceFrameToMotionReference(input)).toBe(input);
  });

  it("is a no-op for a multi-slot-entry list", () => {
    const input: SourceImage[] = [
      { asset_id: "a", type: "reference_frame" },
      { asset_id: "b", type: "reference_frame" }
    ];
    expect(promoteReferenceFrameToMotionReference(input)).toBe(input);
  });

  it("promotes the lone reference_frame while ignoring non-slot element entries", () => {
    const input: SourceImage[] = [
      { asset_id: "char-uuid", type: "reference_frame" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];
    expect(promoteReferenceFrameToMotionReference(input)).toEqual([
      { asset_id: "char-uuid", type: "motion_reference" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ]);
  });
});
