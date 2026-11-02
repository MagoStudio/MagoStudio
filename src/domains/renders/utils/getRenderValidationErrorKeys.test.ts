import { klingO1Model } from "@models/video/klingO1Model";
import { ComputedRenderLimits, VideoSettings } from "@models/video/types";
import { sourceRolesFillingPrimarySlot } from "@models/video/utils/sourceRolesFillingPrimarySlot";
import { enrichVideoSettingsFromSources } from "@store/utils/enrichVideoSettingsFromSources";
import { describe, expect, it } from "vitest";

import {
  getRenderValidationErrorKeys,
  RenderValidationInputs
} from "./getRenderValidationErrorKeys";

const baseValues = {
  mago_engine: klingO1Model.name,
  prompt: "match @Image1 style"
} as VideoSettings;

const durationLimits: ComputedRenderLimits = {
  minFrames: 0,
  maxFrames: 1000,
  modelHasTimeBasedDurationLimits: false
};

const baseInputs: Omit<
  RenderValidationInputs,
  "renderSettingsValues" | "sources"
> = {
  model: klingO1Model,
  fps: 24,
  isUnlimitedModeActive: false,
  inputVideoWidth: 1280,
  inputVideoHeight: 720,
  imageDimensions: undefined,
  rangeFrames: [0, 72],
  durationLimits,
  maskTrack: undefined,
  sourceTrackTimelineOffset: 0,
  crop: undefined,
  tracks: []
};

describe("getRenderValidationErrorKeys — Kling O1 derives image/element presence from sources, not legacy VideoSettings keys", () => {
  it("passes the @Image1 check when the image exists only in sources and allValues.image_ids disagrees", () => {
    const sources = [{ asset_id: "img-a", type: "reference_frame" as const }];
    const renderSettingsValues = {
      ...enrichVideoSettingsFromSources(
        baseValues,
        sources,
        sourceRolesFillingPrimarySlot(klingO1Model)
      ),
      image_ids: []
    } as VideoSettings;

    const errors = getRenderValidationErrorKeys({
      ...baseInputs,
      renderSettingsValues,
      sources
    });

    expect(errors).not.toContain(
      "Please add @Image1 or remove it from your prompt"
    );
  });

  it("still errors the element-pair both-or-neither rule when sources has exactly one angle, even though allValues has a stale complete legacy pair", () => {
    const sources = [
      { asset_id: "img-a", type: "reference_frame" as const },
      { asset_id: "ref-a", type: "element_reference" as const, index: 0 }
    ];
    const renderSettingsValues = {
      ...enrichVideoSettingsFromSources(
        baseValues,
        sources,
        sourceRolesFillingPrimarySlot(klingO1Model)
      ),
      reference_image_id: "stale-ref-from-a-different-model",
      frontal_image_id: "stale-frontal-from-a-different-model"
    } as VideoSettings;

    const errors = getRenderValidationErrorKeys({
      ...baseInputs,
      renderSettingsValues,
      sources
    });

    expect(errors).toContain(
      "You need to add a second angle, or the generation won't work."
    );
  });

  it("passes both the @Image1 and element-pair checks when sources has a full pair and a reference image", () => {
    const sources = [
      { asset_id: "img-a", type: "reference_frame" as const },
      { asset_id: "ref-a", type: "element_reference" as const, index: 0 },
      { asset_id: "front-a", type: "element_frontal" as const, index: 0 }
    ];
    const renderSettingsValues = {
      ...enrichVideoSettingsFromSources(
        baseValues,
        sources,
        sourceRolesFillingPrimarySlot(klingO1Model)
      ),
      prompt: "match @Image1 style @Element1"
    } as VideoSettings;

    const errors = getRenderValidationErrorKeys({
      ...baseInputs,
      renderSettingsValues,
      sources
    });

    expect(errors).toEqual([]);
  });
});
