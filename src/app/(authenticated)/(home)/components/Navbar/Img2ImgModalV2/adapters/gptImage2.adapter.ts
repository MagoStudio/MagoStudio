import { Img2ImgType } from "../schemas";
import { GPT_IMAGE_2_QUALITY_COST } from "../schemas/gptImage2.schema";

import { ModelAdapter } from "./types";

type GptImage2Data = Extract<Img2ImgType, { model: "gpt_image_2" }>;

export const gptImage2Adapter: ModelAdapter<GptImage2Data> = {
  buildSettings: (data) => {
    const uploadedMaskId = data.maskImages?.[0];
    return {
      num_images: 1,
      quality: data.quality,
      ...(uploadedMaskId ? { mask_image_id: uploadedMaskId } : {})
    };
  },
  computeCost: (data) => GPT_IMAGE_2_QUALITY_COST[data.quality],
  availableInRelaxedMode: true
};
