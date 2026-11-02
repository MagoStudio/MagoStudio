import { z } from "zod";

import { CommonModelSchema, validateUploadMode } from "./common.schema";

export const QWEN_COST = 77;

export const QwenSchema = validateUploadMode(
  z.object({
    ...CommonModelSchema,
    model: z.literal("qwen"),
    referenceImages: z.array(z.string()).max(2).default([]),
    prompt: z
      .string()
      .min(1)
      .default(
        "Stylize into an anime with flat colors and clear outlines, keep the composition of the original image"
      ),
    generationCost: z.number().default(QWEN_COST)
  })
);
