import {
  PrepareRenderSettingsContext,
  VideoSettings
} from "@models/video/types";
import { describe, expect, it } from "vitest";

import { klingO3EditProModel } from "./klingO3EditProModel";

const baseContext: PrepareRenderSettingsContext = {
  inputVideoWidth: 1080,
  inputVideoHeight: 1920,
  frameRange: [0, 120],
  fps: 24,
  sources: []
};

const forBackend = (
  settings: VideoSettings,
  sources: PrepareRenderSettingsContext["sources"] = []
) =>
  klingO3EditProModel.formatValuesForBackend!(settings, {
    ...baseContext,
    sources
  });

const forFrontend = (values: VideoSettings) =>
  klingO3EditProModel.formatValuesForFrontend!(values);

const settings = klingO3EditProModel.settingsGroups[0].sections[0].settings;
const elementSetting = settings.find((s) => s.key === "reference_image_id")!;
const promptSetting = settings.find((s) => s.key === "prompt")!;

const elementSources = (
  referenceAssetId?: string,
  frontalAssetId?: string
): PrepareRenderSettingsContext["sources"] => [
  ...(referenceAssetId
    ? [
        {
          asset_id: referenceAssetId,
          type: "element_reference" as const,
          index: 0
        }
      ]
    : []),
  ...(frontalAssetId
    ? [{ asset_id: frontalAssetId, type: "element_frontal" as const, index: 0 }]
    : [])
];

describe("klingO3EditProModel element-pair customValidation (derives from sources, not legacy keys)", () => {
  it("returns null when both element ids are empty", () => {
    expect(
      elementSetting.customValidation!("anything", {} as VideoSettings, [])
    ).toBeNull();
  });

  it("returns null when both element ids are set", () => {
    expect(
      elementSetting.customValidation!(
        "anything",
        {} as VideoSettings,
        elementSources("ref-uuid", "frontal-uuid")
      )
    ).toBeNull();
  });

  it("returns the second-angle error when only element_reference is set", () => {
    expect(
      elementSetting.customValidation!(
        "anything",
        {} as VideoSettings,
        elementSources("ref-uuid")
      )
    ).toBe("You need to add a second angle, or the generation won't work.");
  });

  it("returns the second-angle error when only element_frontal is set", () => {
    expect(
      elementSetting.customValidation!(
        "anything",
        {} as VideoSettings,
        elementSources(undefined, "frontal-uuid")
      )
    ).toBe("You need to add a second angle, or the generation won't work.");
  });

  it("ignores stray legacy reference_image_id on allValues when the sources pair is complete", () => {
    expect(
      elementSetting.customValidation!(
        "anything",
        { reference_image_id: "stale-ref" } as VideoSettings,
        elementSources("ref-uuid", "frontal-uuid")
      )
    ).toBeNull();
  });

  it("still flags a half-pair from sources even when allValues has a complete legacy pair", () => {
    expect(
      elementSetting.customValidation!(
        "anything",
        {
          reference_image_id: "stale-ref",
          frontal_image_id: "stale-frontal"
        } as VideoSettings,
        elementSources("ref-uuid")
      )
    ).toBe("You need to add a second angle, or the generation won't work.");
  });
});

describe("klingO3EditProModel prompt @element1 validation (derives from sources, not legacy keys)", () => {
  it("flags @Element1 in prompt when no element sources are set", () => {
    const result = promptSetting.customValidation!(
      "use @Element1 please",
      {} as VideoSettings,
      []
    );
    expect(result).toBe(
      "Please add @Element1 images or remove it from your prompt"
    );
  });

  it("flags @Element1 in prompt when only one element source is set", () => {
    const result = promptSetting.customValidation!(
      "use @Element1 please",
      {} as VideoSettings,
      elementSources("ref-uuid")
    );
    expect(result).toBe(
      "Please add @Element1 images or remove it from your prompt"
    );
  });

  it("returns null when @Element1 is used and both element sources are set", () => {
    const result = promptSetting.customValidation!(
      "use @Element1 please",
      {} as VideoSettings,
      elementSources("ref-uuid", "frontal-uuid")
    );
    expect(result).toBeNull();
  });

  it("ignores @Element1 case when checking the prompt", () => {
    const result = promptSetting.customValidation!(
      "Use @ELEMENT1 please",
      {} as VideoSettings,
      []
    );
    expect(result).toBe(
      "Please add @Element1 images or remove it from your prompt"
    );
  });

  it("passes the @Image1 check when an image is present only in sources, not in allValues.image_ids", () => {
    const result = promptSetting.customValidation!(
      "match @Image1 style",
      { image_ids: [] } as unknown as VideoSettings,
      [{ asset_id: "ref-a", type: "reference_frame" }]
    );
    expect(result).toBeNull();
  });
});

describe("klingO3EditProModel element-pair round-trip", () => {
  it("formatValuesForBackend wraps both element entries into a single-element array", () => {
    const out = forBackend({} as VideoSettings, [
      { asset_id: "ref-uuid", type: "element_reference", index: 0 },
      { asset_id: "frontal-uuid", type: "element_frontal", index: 0 }
    ]);
    expect(out.elements).toEqual([
      {
        reference_image_id: ["ref-uuid"],
        frontal_image_id: "frontal-uuid"
      }
    ]);
    expect(out.reference_image_id).toBeUndefined();
    expect(out.frontal_image_id).toBeUndefined();
  });

  it("formatValuesForBackend omits elements when only one element entry is present", () => {
    expect(
      forBackend({} as VideoSettings, [
        { asset_id: "ref-uuid", type: "element_reference", index: 0 }
      ]).elements
    ).toBeUndefined();
    expect(
      forBackend({} as VideoSettings, [
        { asset_id: "frontal-uuid", type: "element_frontal", index: 0 }
      ]).elements
    ).toBeUndefined();
  });

  it("formatValuesForFrontend unwraps elements[0] back to scalar reference_image_id and frontal_image_id", () => {
    const out = forFrontend({
      elements: [
        {
          reference_image_id: ["ref-uuid"],
          frontal_image_id: "frontal-uuid"
        }
      ]
    } as VideoSettings);
    expect(out.reference_image_id).toBe("ref-uuid");
    expect(out.frontal_image_id).toBe("frontal-uuid");
    expect(out.elements).toBeUndefined();
  });

  it("formatValuesForFrontend tolerates a legacy scalar reference_image_id in the BE payload", () => {
    const out = forFrontend({
      elements: [
        {
          reference_image_id: "ref-uuid",
          frontal_image_id: "frontal-uuid"
        }
      ]
    } as unknown as VideoSettings);
    expect(out.reference_image_id).toBe("ref-uuid");
    expect(out.frontal_image_id).toBe("frontal-uuid");
  });

  it("formatValuesForFrontend is a no-op when elements is an empty array", () => {
    const out = forFrontend({
      fps: 24,
      elements: [] as string[]
    } as VideoSettings);
    expect(out.reference_image_id).toBeUndefined();
    expect(out.frontal_image_id).toBeUndefined();
    expect(out.fps).toBe(24);
  });

  it("round-trip preserves the element pair through BE → FE → BE", () => {
    const feState = forFrontend({
      elements: [
        {
          reference_image_id: ["ref-uuid"],
          frontal_image_id: "frontal-uuid"
        }
      ]
    } as VideoSettings);
    const reconstructedSources: PrepareRenderSettingsContext["sources"] = [
      {
        asset_id: feState.reference_image_id as string,
        type: "element_reference",
        index: 0
      },
      {
        asset_id: feState.frontal_image_id as string,
        type: "element_frontal",
        index: 0
      }
    ];
    const beAgain = forBackend(feState, reconstructedSources);
    expect(beAgain.elements).toEqual([
      {
        reference_image_id: ["ref-uuid"],
        frontal_image_id: "frontal-uuid"
      }
    ]);
  });
});
