import { SourceImage } from "@domains/renders/types";
import { describe, expect, it } from "vitest";

import {
  formatElementPairForBackend,
  formatElementPairForFrontend
} from "./formatElementPair";

describe("formatElementPairForBackend", () => {
  it("wraps both entries into the single-tuple BE shape when both are present", () => {
    const sources: SourceImage[] = [
      { asset_id: "ref-a", type: "element_reference", index: 0 },
      { asset_id: "front-b", type: "element_frontal", index: 0 }
    ];
    expect(formatElementPairForBackend(sources)).toEqual([
      { reference_image_id: ["ref-a"], frontal_image_id: "front-b" }
    ]);
  });

  it("returns undefined when only the reference entry is present", () => {
    const sources: SourceImage[] = [
      { asset_id: "ref-a", type: "element_reference", index: 0 }
    ];
    expect(formatElementPairForBackend(sources)).toBeUndefined();
  });

  it("returns undefined when only the frontal entry is present", () => {
    const sources: SourceImage[] = [
      { asset_id: "front-b", type: "element_frontal", index: 0 }
    ];
    expect(formatElementPairForBackend(sources)).toBeUndefined();
  });

  it("returns undefined when neither entry is present", () => {
    expect(formatElementPairForBackend([])).toBeUndefined();
  });

  it("ignores non-element entries in the same sources list", () => {
    const sources: SourceImage[] = [
      { asset_id: "motion", type: "motion_reference" },
      { asset_id: "ref-a", type: "element_reference", index: 0 },
      { asset_id: "front-b", type: "element_frontal", index: 0 }
    ];
    expect(formatElementPairForBackend(sources)).toEqual([
      { reference_image_id: ["ref-a"], frontal_image_id: "front-b" }
    ]);
  });
});

describe("formatElementPairForFrontend", () => {
  it("unwraps the array reference id to a scalar", () => {
    expect(
      formatElementPairForFrontend([
        { reference_image_id: ["uuid-a"], frontal_image_id: "uuid-b" }
      ])
    ).toEqual({ reference_image_id: "uuid-a", frontal_image_id: "uuid-b" });
  });

  it("passes through a scalar reference id unchanged", () => {
    expect(
      formatElementPairForFrontend([
        { reference_image_id: "uuid-a", frontal_image_id: "uuid-b" }
      ])
    ).toEqual({ reference_image_id: "uuid-a", frontal_image_id: "uuid-b" });
  });

  it("preserves an undefined frontal id", () => {
    expect(
      formatElementPairForFrontend([{ reference_image_id: ["uuid-a"] }])
    ).toEqual({ reference_image_id: "uuid-a", frontal_image_id: undefined });
  });

  it.each([[undefined], [null], [[]], ["not-an-array"], [{}]])(
    "returns null for absent/empty/non-array elements: %s",
    (elements) => {
      expect(formatElementPairForFrontend(elements)).toBeNull();
    }
  );
});
