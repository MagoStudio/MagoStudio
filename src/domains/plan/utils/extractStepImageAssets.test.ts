import { describe, expect, it } from "vitest";

import { extractStepImageAssets } from "./extractStepImageAssets";

const SAMPLE_UUID = "0123abcd-4567-89ab-cdef-0123456789ab";
const SECOND_UUID = "11111111-2222-3333-4444-555555555555";

describe("extractStepImageAssets", () => {
  it("returns empty arrays for null or undefined input", () => {
    expect(extractStepImageAssets(null)).toEqual({
      outputs: [],
      references: []
    });
    expect(extractStepImageAssets(undefined)).toEqual({
      outputs: [],
      references: []
    });
  });

  it("returns empty arrays when no known asset keys are present", () => {
    expect(extractStepImageAssets({ other_key: SAMPLE_UUID })).toEqual({
      outputs: [],
      references: []
    });
  });

  it("extracts UUID strings stored under known output keys", () => {
    expect(
      extractStepImageAssets({
        asset_id: SAMPLE_UUID,
        image_id: SECOND_UUID,
        unrelated: "foo"
      })
    ).toEqual({ outputs: [SAMPLE_UUID, SECOND_UUID], references: [] });
  });

  it("extracts UUID strings stored under known reference keys", () => {
    expect(
      extractStepImageAssets({
        reference_images: [SAMPLE_UUID, SECOND_UUID]
      })
    ).toEqual({ outputs: [], references: [SAMPLE_UUID, SECOND_UUID] });
  });

  it("ignores values that are not valid UUIDs", () => {
    expect(extractStepImageAssets({ asset_id: "not-a-uuid" })).toEqual({
      outputs: [],
      references: []
    });
  });

  it("ignores non-string values stored under known keys", () => {
    expect(
      extractStepImageAssets({ asset_id: 42, image_id: SAMPLE_UUID })
    ).toEqual({ outputs: [SAMPLE_UUID], references: [] });
  });

  it("extracts shot_reference_image_id as an output", () => {
    expect(
      extractStepImageAssets({ shot_reference_image_id: SAMPLE_UUID })
    ).toEqual({ outputs: [SAMPLE_UUID], references: [] });
  });
});
