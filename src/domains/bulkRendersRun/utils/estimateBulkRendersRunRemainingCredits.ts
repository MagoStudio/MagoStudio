import {
  GptImage2Quality,
  GPT_IMAGE_2_QUALITY_COST
} from "@home/components/Navbar/Img2ImgModalV2/schemas/gptImage2.schema";
import {
  Nanobanana2Resolution,
  NANOBANANA_2_RESOLUTION_COST
} from "@home/components/Navbar/Img2ImgModalV2/schemas/nanobanana2.schema";
import { NANOBANANA_PRO_COST } from "@home/components/Navbar/Img2ImgModalV2/schemas/nanobananaPro.schema";
import { QWEN_COST } from "@home/components/Navbar/Img2ImgModalV2/schemas/qwen.schema";
import { SEEDREAM_5_PRO_COST } from "@home/components/Navbar/Img2ImgModalV2/schemas/seedream5Pro.schema";
import { VideoEngine, VideoSettings } from "@models/video/types";
import { getVideoModelByEngine } from "@models/video/utils/getVideoModelByEngine";
import {
  BulkRendersRunDetailShotOverride,
  BulkRendersRunSettings
} from "@schemas/bulkRendersRun";

import { estimateBulkRendersRunCredits } from "./estimateBulkRendersRunCredits";

const VIDEO_ENGINES_REQUIRING_POSITIVE_MAX_SIZE = new Set<string>([
  VideoEngine.V3_1_0,
  VideoEngine.V3_2_0,
  VideoEngine.V3_3_0,
  VideoEngine.V3_3_0_CNETS,
  VideoEngine.V3_4_0,
  VideoEngine.V4_0_0,
  VideoEngine.V4_1_0,
  VideoEngine.V5_0_0,
  VideoEngine.minimax_reference
]);

const resolveVideoCreditsPerShot = (
  videoSettings: BulkRendersRunSettings | undefined
): number | undefined => {
  const engine = videoSettings?.engine;
  if (!engine) return undefined;

  const videoModel = getVideoModelByEngine(engine);
  if (!videoModel) return undefined;

  const hasPositiveMaxSize =
    typeof videoSettings?.max_size === "number" && videoSettings.max_size > 0;
  if (
    VIDEO_ENGINES_REQUIRING_POSITIVE_MAX_SIZE.has(engine) &&
    !hasPositiveMaxSize
  ) {
    return undefined;
  }

  const frameRange = videoSettings?.frame_range;
  if (!frameRange) return undefined;
  const frameRangeLength = frameRange[1] - frameRange[0];
  if (!Number.isFinite(frameRangeLength) || frameRangeLength <= 0) {
    return undefined;
  }

  try {
    const { impactToShow } = videoModel.calcEstimatedRenderTime(
      videoSettings as VideoSettings,
      frameRangeLength
    );
    return typeof impactToShow === "number" &&
      Number.isFinite(impactToShow) &&
      impactToShow > 0
      ? impactToShow
      : undefined;
  } catch {
    return undefined;
  }
};

const IMAGE_CREDITS_PER_SHOT_RESOLVER_BY_RENDER_MODEL: Record<
  string,
  (imageSettings: BulkRendersRunSettings) => number | undefined
> = {
  gpt_image_2: (imageSettings) => {
    const quality = imageSettings.quality;
    return typeof quality === "string" && quality in GPT_IMAGE_2_QUALITY_COST
      ? GPT_IMAGE_2_QUALITY_COST[quality as GptImage2Quality]
      : undefined;
  },
  nanobanana_2: (imageSettings) => {
    const resolution = imageSettings.resolution;
    return typeof resolution === "string" &&
      resolution in NANOBANANA_2_RESOLUTION_COST
      ? NANOBANANA_2_RESOLUTION_COST[resolution as Nanobanana2Resolution]
      : undefined;
  },
  nanobanana_pro: () => NANOBANANA_PRO_COST,
  seedream_5_pro: () => SEEDREAM_5_PRO_COST,
  qwen: () => QWEN_COST
};

const resolveImageCreditsPerShot = (
  imageSettings: BulkRendersRunSettings | undefined
): number | undefined => {
  const renderModel = imageSettings?.render_model;
  if (!renderModel) return undefined;

  const resolveForRenderModel =
    IMAGE_CREDITS_PER_SHOT_RESOLVER_BY_RENDER_MODEL[renderModel];
  return resolveForRenderModel?.(imageSettings);
};

const mergeShotSettings = (
  masterSettings: BulkRendersRunSettings | undefined,
  shotOverrideSettings: Record<string, unknown> | undefined
): BulkRendersRunSettings | undefined => {
  if (!masterSettings && !shotOverrideSettings) return undefined;
  return {
    ...masterSettings,
    ...shotOverrideSettings
  } as BulkRendersRunSettings;
};

export interface EstimateBulkRendersRunRemainingCreditsInput {
  videoSettings: BulkRendersRunSettings | undefined;
  imageSettings: BulkRendersRunSettings | undefined;
  shotOverridesById:
    | Record<string, BulkRendersRunDetailShotOverride>
    | undefined;
  shotIdsOwingImageRender: string[];
  shotIdsOwingVideoRender: string[];
}

export interface BulkRendersRunRemainingCreditsEstimate {
  estimatedRemainingCredits: number;
  couldNotBePriced: boolean;
}

export const estimateBulkRendersRunRemainingCredits = ({
  videoSettings,
  imageSettings,
  shotOverridesById,
  shotIdsOwingImageRender,
  shotIdsOwingVideoRender
}: EstimateBulkRendersRunRemainingCreditsInput): BulkRendersRunRemainingCreditsEstimate => {
  const imageCreditsByShotId: Record<string, number> = {};
  for (const shotId of shotIdsOwingImageRender) {
    const shotImageSettings = mergeShotSettings(
      imageSettings,
      shotOverridesById?.[shotId]?.img2img_settings
    );
    const credits = resolveImageCreditsPerShot(shotImageSettings);
    if (credits === undefined) {
      return { estimatedRemainingCredits: 0, couldNotBePriced: true };
    }
    imageCreditsByShotId[shotId] = credits;
  }

  const videoCreditsByShotId: Record<string, number> = {};
  for (const shotId of shotIdsOwingVideoRender) {
    const shotVideoSettings = mergeShotSettings(
      videoSettings,
      shotOverridesById?.[shotId]?.video_settings
    );
    const credits = resolveVideoCreditsPerShot(shotVideoSettings);
    if (credits === undefined) {
      return { estimatedRemainingCredits: 0, couldNotBePriced: true };
    }
    videoCreditsByShotId[shotId] = credits;
  }

  const selectedShotIds = Array.from(
    new Set([...shotIdsOwingImageRender, ...shotIdsOwingVideoRender])
  );
  const estimatedRemainingCredits = estimateBulkRendersRunCredits({
    imageCreditsByShotId,
    videoCreditsByShotId,
    selectedShotIds,
    shotIdsWithUploadedFirstFrame: new Set()
  });

  return { estimatedRemainingCredits, couldNotBePriced: false };
};
