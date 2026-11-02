import { z } from "zod";

import {
  CommonModelSchema,
  DEFAULT_IMG2IMG_PROMPT,
  validateUploadMode
} from "./common.schema";

export const SEEDREAM_5_PRO_COST = 120;

export const TRANSIENT_IMG2IMG_STORAGE_KEYS = [
  "maskLayerDataUrl",
  "maskedFrameSrc"
] as const;

export const Seedream5ProSchema = validateUploadMode(
  z.object({
    ...CommonModelSchema,
    model: z.literal("seedream_5_pro"),
    referenceImages: z.array(z.string()).max(9).default([]),
    prompt: z.string().min(1).default(DEFAULT_IMG2IMG_PROMPT),
    maskLayerDataUrl: z.string().optional(),
    maskedFrameSrc: z.string().optional(),
    maskFrameIdx: z.number().optional(),
    generationCost: z.number().default(SEEDREAM_5_PRO_COST)
  })
);

export type Seedream5ProType = z.infer<typeof Seedream5ProSchema>;
