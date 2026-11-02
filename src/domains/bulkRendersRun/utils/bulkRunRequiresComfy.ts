import { CreateBulkRendersRunRequest } from "@schemas/bulkRendersRun";

import { isComfyLocalImageModel } from "@/platform/localImageModels";
import { isComfyLocalVideoModel } from "@/platform/localVideoModels";

/** Check the models each shot actually uses, including supplied frames and overrides. */
export const bulkRunRequiresComfy = (
  request: CreateBulkRendersRunRequest
): boolean =>
  request.timeline_ids.some((id) => {
    const override = request.shot_overrides?.[id];
    const videoModel =
      override?.video_settings?.engine ?? request.video_settings?.engine;
    const imageModel = override?.images?.length
      ? undefined
      : (override?.img2img_settings?.render_model ??
        request.img2img_settings?.render_model);
    return (
      isComfyLocalVideoModel(videoModel ?? undefined) ||
      isComfyLocalImageModel(imageModel ?? undefined)
    );
  });
