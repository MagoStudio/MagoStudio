import { z } from "zod";

import { CommonModelSchema, validateUploadMode } from "./common.schema";

export const QWEN_COST = 77;

export const QWEN_IMAGE_EDIT_SETUP_VALUES = [
  "native-int8-8step",
  "gguf-q5-4step",
  "flux2-klein-4b-q8",
  "flux2-klein-9b-q8"
] as const;

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
    qwen_image_edit_setup: z
      .enum(QWEN_IMAGE_EDIT_SETUP_VALUES)
      .default("gguf-q5-4step"),
    generationCost: z.number().default(QWEN_COST)
  })
);
