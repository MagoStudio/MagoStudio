import { VideoEngine } from "@models/video/types";

import {
  isImageToVideoLocalVideoModel,
  isKlingLocalVideoModel
} from "@/platform/localVideoModels";

import { isMiniMaxH3VfxEditedFrameProvided } from "../../../../desktop/shared/minimaxH3VfxModes";

const toImageIdList = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const collectElementImageIds = (elements: unknown): string[] => {
  if (!Array.isArray(elements)) return [];
  return elements.flatMap((element) => {
    if (typeof element !== "object" || element === null) return [];
    const { reference_image_id, frontal_image_id } = element as {
      reference_image_id?: unknown;
      frontal_image_id?: unknown;
    };
    return [
      ...toImageIdList(reference_image_id),
      ...toImageIdList(frontal_image_id)
    ];
  });
};

export const collectLocalVideoReferenceImageIds = (
  model: VideoEngine | string,
  settings: Record<string, unknown>
): string[] => {
  if (
    model === VideoEngine.minimax_h3_local &&
    isMiniMaxH3VfxEditedFrameProvided(settings)
  ) {
    return [settings.vfx_edited_frame_id as string];
  }

  if (model === VideoEngine.happy_horse_1) {
    return toImageIdList(settings.reference_image_ids);
  }

  if (isImageToVideoLocalVideoModel(model)) {
    return [
      ...toImageIdList(settings.image_id),
      ...toImageIdList(settings.end_image_id)
    ];
  }

  if (isKlingLocalVideoModel(model)) {
    return [
      ...new Set([
        ...toImageIdList(settings.image_id),
        ...toImageIdList(settings.image_ids),
        ...collectElementImageIds(settings.elements)
      ])
    ];
  }

  return toImageIdList(settings.image_ids);
};
