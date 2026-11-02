import { z } from "zod";

import { AssetSchema } from "./asset";
import { SOURCE_IMAGE_TYPES } from "./sourceImageType";

export const ClipSchema = z.object({
  id: z.string(),
  layer_id: z.string(),
  name: z.string(),
  asset: AssetSchema,
  asset_id: z.string(),
  data: z.looseObject({
    duration: z.number().optional(),
    timeline_offset: z.number().optional(),
    frame: z.number().optional(),
    crop_coordinates: z
      .object({
        top_left: z.tuple([z.number(), z.number()]),
        bottom_right: z.tuple([z.number(), z.number()])
      })
      .optional(),
    source_video_dimensions: z.tuple([z.number(), z.number()]).optional(),
    status: z.enum(["success", "failed", "created"]).optional(),
    sources: z
      .looseObject({
        video: z.string().optional(),
        ipadapter_image_source: z.string().optional(),
        images: z
          .array(
            z.object({
              asset_id: z.string().min(1),
              type: z.enum(SOURCE_IMAGE_TYPES),
              index: z.number().int().optional(),
              category: z
                .enum(["background", "character", "objects"])
                .optional()
            })
          )
          .optional()
      })
      .optional(),
    render_engine: z.string().optional(),
    render_settings: z
      .looseObject({
        magov2: z.any().optional()
      })
      .optional(),
    settings: z
      .looseObject({
        frame: z.number().optional(),
        num_images: z.number().optional()
      })
      .optional()
  })
});

export type Clip = z.infer<typeof ClipSchema>;
