import { FE_ONLY_SETTING_KEYS } from "@domains/renders/buildRenderPayload";
import { stripLegacySourceSettingKey } from "@domains/renders/shapeRenderDataForBackend";
import { doesModelDisableFacemeshBlending } from "@domains/renders/utils/doesModelDisableFacemeshBlending";
import { getAdapter } from "@home/components/Navbar/Img2ImgModalV2/adapters";
import {
  Img2ImgSchema,
  Img2ImgType
} from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { RENDER_MODELS } from "@models/video/constants";
import {
  IMAGE_SEQUENCE_EXPORT,
  VideoEngine,
  VideoSettings as VideoModelSettings,
  isFrameBasedModelLimits
} from "@models/video/types";
import {
  Img2ImgSettings,
  SequentialShotsSettings,
  VideoSettings as PlanVideoSettings
} from "@schemas/plan";

const PLAN_IMG2IMG_FALLBACK_MODEL = "nanobanana_pro";

export function mapImg2ImgSettingsToFormValues(
  settings: Img2ImgSettings
): { values: Img2ImgType; usedFallbackModel: boolean } | undefined {
  const baseFields = {
    ...settings,
    frameType: "video" as const,
    model: settings.render_model,
    negativePrompt: settings.negative_prompt,
    referenceImages: settings.reference_images ?? [],
    maskImages: settings.mask_image_id ? [settings.mask_image_id] : []
  };
  const withOriginal = Img2ImgSchema.safeParse(baseFields);
  if (withOriginal.success) {
    return { values: withOriginal.data, usedFallbackModel: false };
  }
  const withFallback = Img2ImgSchema.safeParse({
    ...baseFields,
    model: PLAN_IMG2IMG_FALLBACK_MODEL
  });
  return withFallback.success
    ? { values: withFallback.data, usedFallbackModel: true }
    : undefined;
}

export interface PlanImg2ImgFlags {
  skipPolling: boolean;
  skipMetrics: boolean;
  useAdaptPrompt: boolean;
  maxQualityRetries: number;
}

export function mapImg2ImgToPlanSettings(
  data: Img2ImgType,
  flags: PlanImg2ImgFlags
): Img2ImgSettings {
  const referenceImages =
    "referenceImages" in data ? (data.referenceImages as string[]) : undefined;
  const maskImages =
    "maskImages" in data ? (data.maskImages as string[]) : undefined;

  return {
    ...getAdapter(data).buildSettings(data),
    prompt: "prompt" in data ? (data.prompt as string) : "",
    render_model: data.model,
    render_mode: "credits",
    img_file_type: "jpg",
    frame: 0,
    negative_prompt:
      "negativePrompt" in data ? (data.negativePrompt as string) : undefined,
    reference_images: referenceImages?.length ? referenceImages : undefined,
    mask_image_id: maskImages?.[0] || undefined,
    skip_polling: flags.skipPolling || undefined,
    skip_metrics: flags.skipMetrics || undefined,
    use_adapt_prompt: flags.useAdaptPrompt || undefined,
    max_quality_retries: flags.maxQualityRetries
  };
}

export interface SequentialShotFlags {
  sequentialShots: boolean;
  labelStyleRefs: boolean;
  labelCrossShotRefs: boolean;
  crossShotPromptSuffix: string | null;
  crossShotMetrics: boolean;
  keyframeNumCandidates: number;
  keyframeNumSelect: number;
}

export function mapSequentialShotSettings(
  flags: SequentialShotFlags
): SequentialShotsSettings {
  const base: SequentialShotsSettings = flags.labelStyleRefs
    ? { label_style_refs: true }
    : {};
  if (!flags.sequentialShots) return base;
  return {
    ...base,
    sequential_shots: true,
    label_cross_shot_refs: flags.labelCrossShotRefs || undefined,
    cross_shot_prompt_suffix: flags.crossShotPromptSuffix ?? undefined,
    cross_shot_metrics: flags.crossShotMetrics || undefined,
    keyframe_num_candidates: flags.keyframeNumCandidates,
    keyframe_num_select: flags.keyframeNumSelect
  };
}

export function mapVideoToPlanSettings(
  values: VideoModelSettings,
  modelName: VideoEngine,
  frameRange: [number, number],
  skipPolling: boolean,
  maxQualityRetries: number
): PlanVideoSettings {
  const engine = (values.mago_engine as VideoEngine) ?? modelName;
  const model = RENDER_MODELS.find((m) => m.name === engine);

  const isFrameBased =
    !!model?.renderDurationLimits &&
    isFrameBasedModelLimits(model.renderDurationLimits.modelLimits);

  const transformed = (() => {
    if (!model?.formatValuesForBackend) return values;
    if (isFrameBased) {
      return model.formatValuesForBackend(values, {
        frameRange,
        fps: 0,
        sources: []
      });
    }
    const DEFAULT_TIME_BASED_FPS = 24;
    const DEFAULT_DURATION_SECONDS = 5;
    const fps = (values.fps as number) || DEFAULT_TIME_BASED_FPS;
    const durationInSeconds =
      (values.durationInSeconds as number) || DEFAULT_DURATION_SECONDS;
    const syntheticFrameRange: [number, number] = [
      0,
      Math.round(durationInSeconds * fps)
    ];
    return model.formatValuesForBackend(values, {
      frameRange: syntheticFrameRange,
      fps,
      sources: []
    });
  })();

  const normalized = doesModelDisableFacemeshBlending(engine)
    ? { ...transformed, enable_facemesh_blending: false }
    : transformed;

  const wire: VideoModelSettings = stripLegacySourceSettingKey({
    ...normalized
  }) as VideoModelSettings;
  for (const key of FE_ONLY_SETTING_KEYS) {
    delete wire[key];
  }

  return {
    ...wire,
    engine,
    frame_range: frameRange,
    render_mode: "credits",
    convert_exrs_to_pngs:
      transformed.image_sequence_export !== undefined
        ? transformed.image_sequence_export !== IMAGE_SEQUENCE_EXPORT.EXR_16BIT
        : ((values.convert_exrs_to_pngs as boolean | undefined) ?? true),
    skip_polling: skipPolling || undefined,
    max_quality_retries: maxQualityRetries
  };
}
