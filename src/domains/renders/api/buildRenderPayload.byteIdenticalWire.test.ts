import { SourceImage } from "@domains/renders/types";
import { RenderMode } from "@hooks/types";
import { RENDER_MODELS } from "@models/video/constants";
import { happyHorse1Model } from "@models/video/happyHorse1Model";
import { kling2_6MotionControlModel } from "@models/video/kling2_6MotionControlModel";
import { kling3_0MotionControlModel } from "@models/video/kling3_0MotionControlModel";
import { klingO1Model } from "@models/video/klingO1Model";
import { klingO3EditProModel } from "@models/video/klingO3EditProModel";
import { seedance2Model } from "@models/video/seedance2Model";
import { VideoEngine, VideoSettings } from "@models/video/types";
import { sourceRolesFillingPrimarySlot } from "@models/video/utils/sourceRolesFillingPrimarySlot";
import { enrichVideoSettingsFromSources } from "@store/utils/enrichVideoSettingsFromSources";
import { describe, expect, it } from "vitest";

import { buildRenderPayload } from "./buildRenderPayload";

const baseInput = {
  parentLayerId: "layer-1",
  frameRange: [0, 72],
  inputTrackId: "video-1",
  renderEngine: "magov2",
  renderMode: RenderMode.CREDITS,
  inputVideoWidth: 1280,
  inputVideoHeight: 720,
  fps: 24
};

const storeSynthesizedSettings = (
  storedValues: VideoSettings,
  sources: SourceImage[]
): VideoSettings => {
  const selectedModel = RENDER_MODELS.find(
    (model) => model.name === storedValues.mago_engine
  )!;
  return enrichVideoSettingsFromSources(
    storedValues,
    sources,
    sourceRolesFillingPrimarySlot(selectedModel)
  );
};

describe("buildRenderPayload — byte-identical wire after the sources migration", () => {
  it("Kling O1: picker-written sources produce the exact legacy image_ids + elements + typed sources.images bytes", () => {
    const sources: SourceImage[] = [
      { asset_id: "ref-a", type: "reference_frame" },
      { asset_id: "ref-b", type: "reference_frame" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];
    const body = buildRenderPayload({
      ...baseInput,
      model: klingO1Model,
      renderSettings: storeSynthesizedSettings(
        {
          mago_engine: VideoEngine.kling_o1,
          prompt: "Change the video to match @Image1 style @Element1"
        } as VideoSettings,
        sources
      ),
      sources
    });

    expect(body.render_settings.magov2.image_ids).toEqual(["ref-a", "ref-b"]);
    expect(body.render_settings.magov2.elements).toEqual([
      { reference_image_id: ["er"], frontal_image_id: "ef" }
    ]);
    expect(body.sources.images).toEqual([
      { asset_id: "ref-a", type: "reference_frame" },
      { asset_id: "ref-b", type: "reference_frame" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ]);
  });

  it("Kling O3 Edit Pro: same wire shape as O1", () => {
    const sources: SourceImage[] = [
      { asset_id: "ref-a", type: "reference_frame" }
    ];
    const body = buildRenderPayload({
      ...baseInput,
      model: klingO3EditProModel,
      renderSettings: storeSynthesizedSettings(
        {
          mago_engine: VideoEngine.kling_o3_edit_pro,
          prompt: "Change the video to match @Image1 style"
        } as VideoSettings,
        sources
      ),
      sources
    });

    expect(body.render_settings.magov2.image_ids).toEqual(["ref-a"]);
    expect(body.render_settings.magov2.elements).toBeUndefined();
    expect(body.sources.images).toEqual([
      { asset_id: "ref-a", type: "reference_frame" }
    ]);
  });

  it("Kling 2.6 Motion Control: picker-written motion_reference produces the exact legacy image_id + typed sources.images bytes, with no leaked image_ids/reference_image_id/frontal_image_id", () => {
    const sources: SourceImage[] = [
      { asset_id: "char-uuid", type: "motion_reference" }
    ];
    const body = buildRenderPayload({
      ...baseInput,
      model: kling2_6MotionControlModel,
      renderSettings: storeSynthesizedSettings(
        {
          mago_engine: VideoEngine.kling_2_6_motion_control,
          prompt: ""
        } as VideoSettings,
        sources
      ),
      sources
    });

    expect(body.render_settings.magov2.image_id).toBe("char-uuid");
    expect(body.sources.images).toEqual([
      { asset_id: "char-uuid", type: "motion_reference" }
    ]);
    expect("image_ids" in body.render_settings.magov2).toBe(false);
    expect("reference_image_id" in body.render_settings.magov2).toBe(false);
    expect("frontal_image_id" in body.render_settings.magov2).toBe(false);
  });

  it("Kling 3.0 Motion Control: motion_reference + element roles produce the exact legacy image_id + elements + typed sources.images bytes, with no leaked image_ids", () => {
    const sources: SourceImage[] = [
      { asset_id: "char-uuid", type: "motion_reference" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];
    const body = buildRenderPayload({
      ...baseInput,
      model: kling3_0MotionControlModel,
      renderSettings: storeSynthesizedSettings(
        {
          mago_engine: VideoEngine.kling_3_motion_control,
          prompt: ""
        } as VideoSettings,
        sources
      ),
      sources
    });

    expect(body.render_settings.magov2.image_id).toBe("char-uuid");
    expect(body.render_settings.magov2.elements).toEqual([
      { reference_image_id: ["er"], frontal_image_id: "ef" }
    ]);
    expect(body.sources.images).toEqual([
      { asset_id: "char-uuid", type: "motion_reference" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ]);
    expect("image_ids" in body.render_settings.magov2).toBe(false);
    expect("reference_image_id" in body.render_settings.magov2).toBe(false);
    expect("frontal_image_id" in body.render_settings.magov2).toBe(false);
  });

  it("Seedance 2.0: picker-written reference_frame entries produce the exact legacy image_ids + typed sources.images bytes", () => {
    const sources: SourceImage[] = [
      { asset_id: "s1", type: "reference_frame" },
      { asset_id: "s2", type: "reference_frame" }
    ];
    const body = buildRenderPayload({
      ...baseInput,
      model: seedance2Model,
      renderSettings: storeSynthesizedSettings(
        {
          mago_engine: VideoEngine.seedance_2,
          prompt: "Use @video1 as a reference"
        } as VideoSettings,
        sources
      ),
      sources
    });

    expect(body.render_settings.magov2.image_ids).toEqual(["s1", "s2"]);
    expect(body.sources.images).toEqual([
      { asset_id: "s1", type: "reference_frame" },
      { asset_id: "s2", type: "reference_frame" }
    ]);
  });

  it("Happy Horse 1.0: picker-written reference_frame entries produce the exact legacy reference_image_ids + typed sources.images bytes", () => {
    const sources: SourceImage[] = [
      { asset_id: "h1", type: "reference_frame" }
    ];
    const body = buildRenderPayload({
      ...baseInput,
      model: happyHorse1Model,
      renderSettings: storeSynthesizedSettings(
        {
          mago_engine: VideoEngine.happy_horse_1,
          prompt: "Change the video into"
        } as VideoSettings,
        sources
      ),
      sources
    });

    expect(body.render_settings.magov2.reference_image_ids).toEqual(["h1"]);
    expect("image_ids" in body.render_settings.magov2).toBe(false);
    expect(body.sources.images).toEqual([
      { asset_id: "h1", type: "reference_frame" }
    ]);
  });

  it("Kling 2.6 Motion Control with no sources at all: image_ids never appears even as an empty array", () => {
    const sources: SourceImage[] = [];
    const body = buildRenderPayload({
      ...baseInput,
      model: kling2_6MotionControlModel,
      renderSettings: storeSynthesizedSettings(
        {
          mago_engine: VideoEngine.kling_2_6_motion_control,
          prompt: ""
        } as VideoSettings,
        sources
      ),
      sources
    });

    expect("image_ids" in body.render_settings.magov2).toBe(false);
    expect("reference_image_id" in body.render_settings.magov2).toBe(false);
    expect("frontal_image_id" in body.render_settings.magov2).toBe(false);
    expect("source_image_slot" in body.render_settings.magov2).toBe(false);
  });
});
