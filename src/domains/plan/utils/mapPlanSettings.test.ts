import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { describe, expect, it } from "vitest";

import {
  mapImg2ImgToPlanSettings,
  mapSequentialShotSettings,
  PlanImg2ImgFlags,
  SequentialShotFlags
} from "./mapPlanSettings";

const baseData = {
  model: "gpt_image_2",
  prompt: "make it anime"
} as unknown as Img2ImgType;

const baseFlags: PlanImg2ImgFlags = {
  skipPolling: false,
  skipMetrics: false,
  useAdaptPrompt: false,
  maxQualityRetries: 2
};

const baseSequentialFlags: SequentialShotFlags = {
  sequentialShots: false,
  labelStyleRefs: false,
  labelCrossShotRefs: false,
  crossShotPromptSuffix: null,
  crossShotMetrics: false,
  keyframeNumCandidates: 5,
  keyframeNumSelect: 1
};

describe("mapImg2ImgToPlanSettings", () => {
  it("maps the core fields and hardcodes render_mode/img_file_type/frame", () => {
    const result = mapImg2ImgToPlanSettings(baseData, baseFlags);

    expect(result).toMatchObject({
      prompt: "make it anime",
      render_model: "gpt_image_2",
      render_mode: "credits",
      img_file_type: "jpg",
      frame: 0
    });
  });

  it("renames referenceImages to reference_images", () => {
    const data = {
      ...baseData,
      referenceImages: ["asset-1", "asset-2"]
    } as unknown as Img2ImgType;

    expect(mapImg2ImgToPlanSettings(data, baseFlags).reference_images).toEqual([
      "asset-1",
      "asset-2"
    ]);
  });

  it("derives mask_image_id from the first maskImages entry", () => {
    const data = {
      ...baseData,
      maskImages: ["mask-asset"]
    } as unknown as Img2ImgType;

    expect(mapImg2ImgToPlanSettings(data, baseFlags).mask_image_id).toBe(
      "mask-asset"
    );
  });

  it("omits reference_images and mask_image_id when empty", () => {
    const data = {
      ...baseData,
      referenceImages: [],
      maskImages: []
    } as unknown as Img2ImgType;

    const result = mapImg2ImgToPlanSettings(data, baseFlags);

    expect(result.reference_images).toBeUndefined();
    expect(result.mask_image_id).toBeUndefined();
  });

  it("threads skip flags through only when truthy", () => {
    expect(mapImg2ImgToPlanSettings(baseData, baseFlags)).toMatchObject({
      skip_polling: undefined,
      skip_metrics: undefined
    });
    expect(
      mapImg2ImgToPlanSettings(baseData, {
        ...baseFlags,
        skipPolling: true,
        skipMetrics: true
      })
    ).toMatchObject({
      skip_polling: true,
      skip_metrics: true
    });
  });

  it("threads max_quality_retries through verbatim, including 0", () => {
    expect(
      mapImg2ImgToPlanSettings(baseData, { ...baseFlags, maxQualityRetries: 0 })
        .max_quality_retries
    ).toBe(0);
    expect(
      mapImg2ImgToPlanSettings(baseData, { ...baseFlags, maxQualityRetries: 5 })
        .max_quality_retries
    ).toBe(5);
  });

  it("never emits cross-shot keys (they are plan-level, not img2img)", () => {
    const result = mapImg2ImgToPlanSettings(baseData, baseFlags) as Record<
      string,
      unknown
    >;

    expect(result.sequential_shots).toBeUndefined();
    expect(result.label_cross_shot_refs).toBeUndefined();
    expect(result.keyframe_num_candidates).toBeUndefined();
    expect(result.keyframe_num_select).toBeUndefined();
  });
});

describe("mapSequentialShotSettings", () => {
  it("returns an empty object when sequentialShots is off (legacy parallel)", () => {
    expect(
      mapSequentialShotSettings({
        ...baseSequentialFlags,
        sequentialShots: false,
        labelCrossShotRefs: true,
        keyframeNumCandidates: 8,
        keyframeNumSelect: 3
      })
    ).toEqual({});
  });

  it("emits all fields when sequentialShots is on", () => {
    expect(
      mapSequentialShotSettings({
        sequentialShots: true,
        labelStyleRefs: true,
        labelCrossShotRefs: true,
        crossShotPromptSuffix: null,
        crossShotMetrics: true,
        keyframeNumCandidates: 8,
        keyframeNumSelect: 3
      })
    ).toEqual({
      sequential_shots: true,
      label_style_refs: true,
      label_cross_shot_refs: true,
      cross_shot_metrics: true,
      keyframe_num_candidates: 8,
      keyframe_num_select: 3
    });
  });

  it("threads cross_shot_prompt_suffix through when set", () => {
    expect(
      mapSequentialShotSettings({
        ...baseSequentialFlags,
        sequentialShots: true,
        labelCrossShotRefs: true,
        crossShotPromptSuffix: "custom instruction"
      })
    ).toMatchObject({ cross_shot_prompt_suffix: "custom instruction" });

    expect(
      mapSequentialShotSettings({
        ...baseSequentialFlags,
        sequentialShots: true,
        labelCrossShotRefs: true,
        crossShotPromptSuffix: ""
      })
    ).toMatchObject({ cross_shot_prompt_suffix: "" });
  });

  it("omits the optional booleans when sequential is on but they are off", () => {
    const result = mapSequentialShotSettings({
      ...baseSequentialFlags,
      sequentialShots: true,
      labelStyleRefs: false,
      labelCrossShotRefs: false,
      crossShotMetrics: false
    });

    expect(result.sequential_shots).toBe(true);
    expect(result.label_style_refs).toBeUndefined();
    expect(result.label_cross_shot_refs).toBeUndefined();
    expect(result.cross_shot_metrics).toBeUndefined();
  });

  it("sends label_style_refs even when sequentialShots is off", () => {
    expect(
      mapSequentialShotSettings({
        ...baseSequentialFlags,
        sequentialShots: false,
        labelStyleRefs: true
      })
    ).toEqual({ label_style_refs: true });
  });
});
