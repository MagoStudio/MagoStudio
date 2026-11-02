import { z } from "zod";

import { CommonModelSchema, validateUploadMode } from "./common.schema";

export const GPT_IMAGE_2_QUALITIES = ["medium", "high"] as const;

export type GptImage2Quality = (typeof GPT_IMAGE_2_QUALITIES)[number];

export const GPT_IMAGE_2_QUALITY_COST: Record<GptImage2Quality, number> = {
  medium: 50,
  high: 190
};

export const GPT_IMAGE_2_MASK_EXAMPLE_IMAGE =
  "/images/gpt-image-2-mask-example.jpg";

export const GptImage2Schema = validateUploadMode(
  z.object({
    ...CommonModelSchema,
    model: z.literal("gpt_image_2"),
    prompt: z
      .string()
      .default(
        "Stylize into an anime with flat colors and clear outlines, keep the composition of the original image"
      ),
    quality: z.enum(GPT_IMAGE_2_QUALITIES).default("medium"),
    maskImages: z.array(z.string()).max(1).default([]),
    referenceImages: z.array(z.string()).max(9).default([]),
    generationCost: z.number().default(GPT_IMAGE_2_QUALITY_COST.medium)
  })
);
