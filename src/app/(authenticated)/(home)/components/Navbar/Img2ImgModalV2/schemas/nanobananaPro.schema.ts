import { z } from "zod";

import {
  CommonModelSchema,
  DEFAULT_IMG2IMG_PROMPT,
  validateUploadMode
} from "./common.schema";

export const NANOBANANA_PRO_COST = 170;

export const NanobananaProSchema = validateUploadMode(
  z.object({
    ...CommonModelSchema,
    model: z.literal("nanobanana_pro"),
    referenceImages: z.array(z.string()).max(9).default([]),
    prompt: z.string().min(1).default(DEFAULT_IMG2IMG_PROMPT),
    generationCost: z.number().default(NANOBANANA_PRO_COST)
  })
);
