import { SourceImage } from "@domains/renders/types";
import { describe, expect, it } from "vitest";

import { removeSourceEntriesForRoles } from "./removeSourceEntriesForRoles";

describe("removeSourceEntriesForRoles", () => {
  it("removes every entry whose type is in the given roles", () => {
    const keyFrameEntry: SourceImage = {
      asset_id: "key-frame-asset",
      type: "key_frame",
      index: 0
    };
    const styleReferenceEntry: SourceImage = {
      asset_id: "style-reference-asset",
      type: "style_reference"
    };
    const referenceFrameEntry: SourceImage = {
      asset_id: "reference-frame-asset",
      type: "reference_frame"
    };

    expect(
      removeSourceEntriesForRoles(
        [keyFrameEntry, styleReferenceEntry, referenceFrameEntry],
        ["key_frame", "style_reference"]
      )
    ).toEqual([referenceFrameEntry]);
  });

  it("removes a stale legacy-role entry alongside the current primary-role entry", () => {
    const staleStyleReferenceEntry: SourceImage = {
      asset_id: "stale-style-reference-asset",
      type: "style_reference"
    };
    const currentKeyFrameEntry: SourceImage = {
      asset_id: "current-key-frame-asset",
      type: "key_frame",
      index: 0
    };

    expect(
      removeSourceEntriesForRoles(
        [staleStyleReferenceEntry, currentKeyFrameEntry],
        ["key_frame", "style_reference", "reference_frame"]
      )
    ).toEqual([]);
  });

  it("leaves entries whose type is not in the given roles untouched", () => {
    const elementReferenceEntry: SourceImage = {
      asset_id: "element-reference-asset",
      type: "element_reference",
      index: 0
    };

    expect(
      removeSourceEntriesForRoles(
        [elementReferenceEntry],
        ["key_frame", "style_reference"]
      )
    ).toEqual([elementReferenceEntry]);
  });

  it("returns the sources unchanged when no roles are given", () => {
    const referenceFrameEntry: SourceImage = {
      asset_id: "reference-frame-asset",
      type: "reference_frame"
    };

    expect(removeSourceEntriesForRoles([referenceFrameEntry], [])).toEqual([
      referenceFrameEntry
    ]);
  });
});
