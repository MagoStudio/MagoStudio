import { SourceImage, SourceImageType } from "@domains/renders/types";
import { describe, expect, it } from "vitest";

import { promoteLegacySlotSourceToPrimaryRole } from "./promoteLegacySlotSourceToPrimaryRole";

const motionControlSupportedRoles = new Set<SourceImageType>([
  "motion_reference",
  "element_reference",
  "element_frontal"
]);

const magoTransformSupportedRoles = new Set<SourceImageType>([
  "key_frame",
  "reference_frame"
]);

describe("promoteLegacySlotSourceToPrimaryRole", () => {
  it("promotes a stranded reference_frame to motion_reference and drops the index", () => {
    const sources: SourceImage[] = [
      { asset_id: "char-uuid", type: "reference_frame" }
    ];

    expect(
      promoteLegacySlotSourceToPrimaryRole(
        sources,
        ["motion_reference"],
        motionControlSupportedRoles,
        0
      )
    ).toEqual([{ asset_id: "char-uuid", type: "motion_reference" }]);
  });

  it("promotes a stranded key_frame to motion_reference for a motion-control model", () => {
    const sources: SourceImage[] = [
      { asset_id: "char-uuid", type: "key_frame", index: 4 }
    ];

    expect(
      promoteLegacySlotSourceToPrimaryRole(
        sources,
        ["motion_reference"],
        motionControlSupportedRoles,
        0
      )
    ).toEqual([{ asset_id: "char-uuid", type: "motion_reference" }]);
  });

  it("leaves the element pair untouched while promoting the stranded character entry", () => {
    const sources: SourceImage[] = [
      { asset_id: "char-uuid", type: "key_frame", index: 0 },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];

    expect(
      promoteLegacySlotSourceToPrimaryRole(
        sources,
        ["motion_reference"],
        motionControlSupportedRoles,
        0
      )
    ).toEqual([
      { asset_id: "char-uuid", type: "motion_reference" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ]);
  });

  it("leaves a reference_frame alone when the model legitimately round-trips it on the wire", () => {
    const sources: SourceImage[] = [
      { asset_id: "img-a", type: "reference_frame" }
    ];

    expect(
      promoteLegacySlotSourceToPrimaryRole(
        sources,
        ["key_frame", "reference_frame"],
        magoTransformSupportedRoles,
        0
      )
    ).toEqual(sources);
  });

  it("carries the keyframe index when the primary role is key_frame", () => {
    const sources: SourceImage[] = [
      { asset_id: "img-a", type: "reference_frame" }
    ];

    expect(
      promoteLegacySlotSourceToPrimaryRole(
        sources,
        ["key_frame"],
        new Set<SourceImageType>(["key_frame"]),
        7
      )
    ).toEqual([{ asset_id: "img-a", type: "key_frame", index: 7 }]);
  });

  it("is a no-op when the primary slot is already filled by a declared role", () => {
    const sources: SourceImage[] = [
      { asset_id: "char-uuid", type: "motion_reference" },
      { asset_id: "stray", type: "reference_frame" }
    ];

    expect(
      promoteLegacySlotSourceToPrimaryRole(
        sources,
        ["motion_reference"],
        motionControlSupportedRoles,
        0
      )
    ).toEqual(sources);
  });

  it("is a no-op when several stranded entries compete, since none is unambiguously the primary", () => {
    const sources: SourceImage[] = [
      { asset_id: "a", type: "reference_frame" },
      { asset_id: "b", type: "key_frame", index: 0 }
    ];

    expect(
      promoteLegacySlotSourceToPrimaryRole(
        sources,
        ["motion_reference"],
        motionControlSupportedRoles,
        0
      )
    ).toEqual(sources);
  });

  it("is a no-op when the model declares no primary slot at all", () => {
    const sources: SourceImage[] = [
      { asset_id: "ref-a", type: "reference_frame" }
    ];

    expect(
      promoteLegacySlotSourceToPrimaryRole(
        sources,
        [],
        new Set<SourceImageType>(["reference_frame"]),
        0
      )
    ).toEqual(sources);
  });

  it("is a no-op for empty sources", () => {
    expect(
      promoteLegacySlotSourceToPrimaryRole(
        [],
        ["motion_reference"],
        motionControlSupportedRoles,
        0
      )
    ).toEqual([]);
  });
});
