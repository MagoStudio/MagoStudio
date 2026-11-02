import { z } from "zod";

import { SOURCE_IMAGE_TYPES } from "./sourceImageType";
import { VideoSettingsSchema } from "./video";

const AssetStatusSchema = z.enum([
  "ERROR",
  "PENDING",
  "INQUEUE",
  "PAUSED",
  "INPROGRESS",
  "FINISHED",
  "CANCELLED"
]);

const ThumbnailSchema = z.object({
  width: z.number(),
  height: z.number(),
  single_frame: z.boolean(),
  key: z.string(),
  s3_url: z.string()
});

const PromptSchema = z.object({
  positive: z.object({
    content: z.string(),
    setting: z.string(),
    style: z.string(),
    references: z.string()
  }),
  negative: z.string()
});

export const DataSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    duration: z.number(),
    processed: z.boolean(),
    fps: z.number(),
    total_frames: z.number(),
    data: z
      .object({
        parent_layer_id: z.string(),
        sources: z
          .object({
            video: z.string(),
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
        duration: z.number().optional(),
        timeline_offset: z.number().optional()
      })
      .optional(),
    skeletonFrameRange: z.tuple([z.number(), z.number()]).optional(),
    size: z.tuple([z.number(), z.number()]),
    timeline_offset: z.number().optional(),
    sources: z
      .object({
        video: z.object({
          data: DataSchema
        }),
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
    queue_status: AssetStatusSchema.optional(),
    renderSettings: z.object({
      magov2: VideoSettingsSchema
    }),
    renderEngine: z.literal("magov2"),
    parent_render: z.string(),
    hasBeenInteractedWithSinceRenderFinished: z.boolean().optional(),
    error: z
      .object({
        error: z.string().optional(),
        error_type: z.string().optional(),
        message: z.string().optional(),
        details: z
          .object({
            error: z.string(),
            format: z.string(),
            key: z.string()
          })
          .optional()
      })
      .optional(),
    thumbnails: z.array(ThumbnailSchema),
    status: z
      .enum(["created", "not_ingested", "processing", "ingested"])
      .optional(),
    prompt: PromptSchema.optional(),
    controlNetOverride: z
      .object({
        name: z.string(),
        video: z.string()
      })
      .optional()
  })
);

export type Data = z.infer<typeof DataSchema>;
