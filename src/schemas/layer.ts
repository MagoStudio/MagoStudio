import { z } from "zod";

import { ClipSchema } from "@/schemas/clip";

export enum LayerType {
  RENDER = "RENDER",
  IMAGE = "IMAGE",
  IMG2IMG = "IMG2IMG"
}

export const LayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  timeline_id: z.string(),
  project_id: z.string().nullish(),
  status: z.string().nullish(),
  user_id: z.string(),
  type: z.enum(LayerType),
  active: z.coerce.boolean(),
  muted: z.coerce.boolean(),
  visible: z.coerce.boolean(),
  layer_order: z.coerce.number(),
  rating: z.number(),
  created_at: z.coerce.date(),
  data: z.looseObject({
    duration: z.number().optional(),
    renderEngine: z.string().optional(),
    controlNetOverride: z
      .object({
        name: z.string(),
        video: z.string()
      })
      .optional(),
    skeletonFrameRange: z.tuple([z.number(), z.number()]).optional(),
    renderSettings: z
      .looseObject({
        magov2: z
          .looseObject({
            mago_engine: z.string().optional()
          })
          .optional()
      })
      .optional()
  }),
  clips: z.array(ClipSchema)
});

export type Layer = z.infer<typeof LayerSchema> & {
  derivedTrackIds?: string[];
};
