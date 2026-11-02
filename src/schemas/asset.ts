import { z } from "zod";

import { SOURCE_IMAGE_TYPES } from "./sourceImageType";

const ThumbnailSchema = z.looseObject({
  width: z.number(),
  height: z.number(),
  key: z.string(),
  s3_url: z.string().optional(),
  first_frame: z.union([z.number(), z.boolean()]).optional()
});

const ControlNetEntrySchema = z.object({
  video: z.string(),
  name: z.string(),
  metadata: z.object({
    fps: z.number(),
    width: z.number(),
    height: z.number(),
    nb_frames: z.number()
  }),
  settings: z
    .object({
      frame_range: z.any().optional(),
      video_init_timeline_offset: z.any().optional(),
      max_size: z.any().optional(),
      controlmap_resolution: z.any().optional(),
      enable_facemesh_blending: z.any().optional(),
      video_init_asset_id: z.any().optional()
    })
    .optional()
});

const PromptSchema = z.looseObject({
  positive: z.object({
    content: z.string(),
    setting: z.string(),
    style: z.string(),
    references: z.string(),
    action: z.string().optional()
  }),
  negative: z.string(),
  is_content_consistent: z.boolean().optional()
});

export enum AssetType {
  RENDER = "RENDER",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  IMAGE_LIST = "IMAGE_LIST"
}

export enum AssetStatus {
  ERROR = "ERROR",
  PENDING = "PENDING",
  INQUEUE = "INQUEUE",
  PAUSED = "PAUSED",
  INPROGRESS = "INPROGRESS",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED"
}

export const AssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  filepath: z.string(),
  project_ids: z.array(z.string()).optional(),
  type: z.enum(AssetType),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  origin: z.enum(["uploaded", "generated"]),
  last_used: z.coerce.date(),
  rate: z.number(),

  data: z.looseObject({
    origin: z.enum(["uploaded", "generated"]).optional(),
    duration: z.number().optional(),
    processed: z.boolean().optional(),
    fps: z.number().optional(),
    total_frames: z.number().optional(),
    prompt: PromptSchema.optional(),
    /** Prose describing the image, generated once from the image itself and user-editable.
     * ABSENT means never described; present-but-blank means deliberately cleared, which the
     * backend keeps rather than regenerating. Do not collapse the two into one falsy check. */
    description: z.string().nullable().optional(),
    size: z.tuple([z.number(), z.number()]).optional(),
    output_size: z.tuple([z.number(), z.number()]).optional(),
    status: z
      .enum(["created", "not_ingested", "processing", "ingested"])
      .optional(),
    thumbnails: z.array(ThumbnailSchema).optional(),
    height: z.number().optional(),
    width: z.number().optional(),

    last_used: z.coerce.date().optional(),
    thumbnail_filepath: z.string().optional(),

    queue_progress: z.number().optional(),
    output_duration: z.number().optional(),
    output_fps: z.number().optional(),
    video_key: z.string().optional(),

    parent_render: z.string().optional(),
    renderEngine: z.literal("magov2").optional(),
    renderSettings: z
      .object({
        magov2: z.record(z.string(), z.any())
      })
      .optional(),
    queue_status: z.enum(AssetStatus).optional(),
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
    data: z
      .looseObject({
        render_settings: z
          .looseObject({
            magov2: z
              .looseObject({
                mago_engine: z.string().optional()
              })
              .optional()
          })
          .optional(),
        sources: z
          .looseObject({
            ipadapter_image_source: z.string().optional(),
            images: z
              .array(
                z.looseObject({
                  asset_id: z.string().min(1),
                  type: z.enum(SOURCE_IMAGE_TYPES),
                  index: z.number().int().optional()
                })
              )
              .optional()
          })
          .optional()
      })
      .optional()
  }),
  manifest: z
    .object({
      controlNets: z.array(ControlNetEntrySchema).optional().default([]),
      controlNetCache: z.array(ControlNetEntrySchema).optional()
    })
    .transform((manifest) => ({
      ...manifest,
      controlNets:
        manifest.controlNets.length > 0
          ? manifest.controlNets
          : (manifest.controlNetCache ?? [])
    }))
    .nullable()
    .optional()
});

export type Asset = z.infer<typeof AssetSchema>;
