import { SourceImage } from "@domains/renders/types";
import { VideoSettings } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { enrichVideoSettingsFromSources } from "./enrichVideoSettingsFromSources";

const baseValues = { mago_engine: "kling_o1", prompt: "" } as VideoSettings;

describe("enrichVideoSettingsFromSources", () => {
  it("derives source_image_slot from the first entry matching a declared primary-slot role", () => {
    const sources: SourceImage[] = [
      { asset_id: "ref-a", type: "reference_frame" }
    ];

    expect(
      enrichVideoSettingsFromSources(baseValues, sources, ["reference_frame"])
        .source_image_slot
    ).toBe("ref-a");
  });

  it("derives source_image_slot from a motion_reference entry when that is the declared primary-slot role", () => {
    const sources: SourceImage[] = [
      { asset_id: "char-a", type: "motion_reference" }
    ];

    expect(
      enrichVideoSettingsFromSources(baseValues, sources, ["motion_reference"])
        .source_image_slot
    ).toBe("char-a");
  });

  it("matches any of several declared primary-slot roles", () => {
    const sources: SourceImage[] = [
      { asset_id: "style-a", type: "style_reference" }
    ];

    expect(
      enrichVideoSettingsFromSources(baseValues, sources, [
        "style_reference",
        "key_frame"
      ]).source_image_slot
    ).toBe("style-a");
  });

  it("leaves source_image_slot undefined when no source matches a declared primary-slot role", () => {
    const sources: SourceImage[] = [
      { asset_id: "ref-a", type: "reference_frame" }
    ];

    expect(
      enrichVideoSettingsFromSources(baseValues, sources, ["motion_reference"])
        .source_image_slot
    ).toBeUndefined();
  });

  it("leaves source_image_slot undefined when the model declares no primary slot", () => {
    const sources: SourceImage[] = [
      { asset_id: "ref-a", type: "reference_frame" }
    ];

    expect(
      enrichVideoSettingsFromSources(baseValues, sources, []).source_image_slot
    ).toBeUndefined();
  });

  it("collects every reference_frame asset id into image_ids, in order", () => {
    const sources: SourceImage[] = [
      { asset_id: "ref-a", type: "reference_frame" },
      { asset_id: "ref-b", type: "reference_frame" },
      { asset_id: "er", type: "element_reference", index: 0 }
    ];

    expect(
      enrichVideoSettingsFromSources(baseValues, sources, ["reference_frame"])
        .image_ids
    ).toEqual(["ref-a", "ref-b"]);
  });

  it("derives reference_image_id and frontal_image_id from the element pair", () => {
    const sources: SourceImage[] = [
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];

    const enriched = enrichVideoSettingsFromSources(baseValues, sources, []);

    expect(enriched.reference_image_id).toBe("er");
    expect(enriched.frontal_image_id).toBe("ef");
  });

  it("returns an empty image_ids array and undefined roles when sources is empty", () => {
    const enriched = enrichVideoSettingsFromSources(
      baseValues,
      [],
      ["reference_frame"]
    );

    expect(enriched.image_ids).toEqual([]);
    expect(enriched.source_image_slot).toBeUndefined();
    expect(enriched.reference_image_id).toBeUndefined();
    expect(enriched.frontal_image_id).toBeUndefined();
  });

  it("forces control_type to depth when skip_cnet_preprocess is set", () => {
    const enriched = enrichVideoSettingsFromSources(
      { ...baseValues, skip_cnet_preprocess: true } as VideoSettings,
      [],
      []
    );

    expect(enriched.control_type).toBe("depth");
  });
});
