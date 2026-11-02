import { z } from "zod";

import {
  CommonModelSchema,
  DEFAULT_IMG2IMG_PROMPT,
  validateUploadMode
} from "./common.schema";

export const NANOBANANA_2_RESOLUTIONS = ["0.5K", "1K", "2K", "4K"] as const;

export type Nanobanana2Resolution = (typeof NANOBANANA_2_RESOLUTIONS)[number];

export const NANOBANANA_2_RESOLUTION_COST: Record<
  Nanobanana2Resolution,
  number
> = {
  "0.5K": 92,
  "1K": 122,
  "2K": 183,
  "4K": 243
};

export const Nanobanana2Schema = validateUploadMode(
  z.object({
    ...CommonModelSchema,
    model: z.literal("nanobanana_2"),
    referenceImages: z.array(z.string()).max(9).default([]),
    prompt: z.string().min(1).default(DEFAULT_IMG2IMG_PROMPT),
    resolution: z.enum(NANOBANANA_2_RESOLUTIONS).default("2K"),
    generationCost: z.number().default(NANOBANANA_2_RESOLUTION_COST["2K"])
  })
);
