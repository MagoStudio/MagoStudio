import { SourceImage } from "@domains/renders/types";
import { describe, expect, it } from "vitest";

import { findPrimarySlotSourceEntry } from "./findPrimarySlotSourceEntry";

describe("findPrimarySlotSourceEntry", () => {
  it("matches a key_frame entry when key_frame is a declared role", () => {
    const keyFrameEntry: SourceImage = {
      asset_id: "key-frame-asset",
      type: "key_frame",
      index: 0
    };

    expect(
      findPrimarySlotSourceEntry(
        [keyFrameEntry],
        ["key_frame", "style_reference"]
      )
    ).toBe(keyFrameEntry);
  });

  it("matches a legacy style_reference entry when style_reference is a declared role", () => {
    const styleReferenceEntry: SourceImage = {
      asset_id: "style-reference-asset",
      type: "style_reference"
    };

    expect(
      findPrimarySlotSourceEntry(
        [styleReferenceEntry],
        ["key_frame", "style_reference"]
      )
    ).toBe(styleReferenceEntry);
  });

  it("prefers the first declared role when two slot-typed entries exist", () => {
    const keyFrameEntry: SourceImage = {
      asset_id: "key-frame-asset",
      type: "key_frame",
      index: 0
    };
    const styleReferenceEntry: SourceImage = {
      asset_id: "style-reference-asset",
      type: "style_reference"
    };

    expect(
      findPrimarySlotSourceEntry(
        [styleReferenceEntry, keyFrameEntry],
        ["key_frame", "style_reference"]
      )
    ).toBe(keyFrameEntry);

    expect(
      findPrimarySlotSourceEntry(
        [styleReferenceEntry, keyFrameEntry],
        ["style_reference", "key_frame"]
      )
    ).toBe(styleReferenceEntry);
  });

  it("returns undefined when no source matches any declared role", () => {
    const referenceFrameEntry: SourceImage = {
      asset_id: "reference-frame-asset",
      type: "reference_frame"
    };

    expect(
      findPrimarySlotSourceEntry(
        [referenceFrameEntry],
        ["key_frame", "style_reference"]
      )
    ).toBeUndefined();
  });

  it("never matches element or motion reference entries", () => {
    const elementReferenceEntry: SourceImage = {
      asset_id: "element-reference-asset",
      type: "element_reference",
      index: 0
    };
    const motionReferenceEntry: SourceImage = {
      asset_id: "motion-reference-asset",
      type: "motion_reference"
    };

    expect(
      findPrimarySlotSourceEntry(
        [elementReferenceEntry, motionReferenceEntry],
        ["key_frame", "style_reference"]
      )
    ).toBeUndefined();
  });
});
