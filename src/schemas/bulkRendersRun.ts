import { z } from "zod";

export const BULK_RENDERS_RUN_NAME_MAX_LENGTH = 200;

const UTF16_CODE_UNITS_PER_ASTRAL_CODE_POINT = 2;

const BULK_RENDERS_RUN_NAME_MAX_UTF16_LENGTH =
  BULK_RENDERS_RUN_NAME_MAX_LENGTH * UTF16_CODE_UNITS_PER_ASTRAL_CODE_POINT;

const BulkRendersRunStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "FAILED",
  "CANCELLED"
]);

export type BulkRendersRunStatus = z.infer<typeof BulkRendersRunStatusSchema>;

const BulkRendersRunStepStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "SKIPPED"
]);

type BulkRendersRunStepStatus = z.infer<typeof BulkRendersRunStepStatusSchema>;

const BulkRendersRunSettingsSchema = z.looseObject({
  skip_polling: z.boolean().nullish(),
  skip_metrics: z.boolean().nullish(),
  max_quality_retries: z.number().nullish(),
  engine: z.string().nullish(),
  render_model: z.string().nullish(),
  frame_range: z.tuple([z.number(), z.number()]).nullish().catch(undefined),
  width: z.number().nullish(),
  height: z.number().nullish(),
  max_size: z.number().nullish(),
  fps: z.number().nullish(),
  resolution: z.string().nullish(),
  quality: z.string().nullish(),
  upscale_scale_factor: z.number().nullish()
});

export type BulkRendersRunSettings = z.infer<
  typeof BulkRendersRunSettingsSchema
>;

const BulkRendersRunShotGeneratedFrameOverrideSchema = z.object({
  img2img_settings: BulkRendersRunSettingsSchema.optional(),
  video_settings: BulkRendersRunSettingsSchema.optional(),
  images: z.undefined().optional()
});

const BulkRendersRunShotSuppliedFrameOverrideSchema = z.object({
  img2img_settings: z.undefined().optional(),
  video_settings: BulkRendersRunSettingsSchema.optional(),
  images: z.array(
    z.object({
      asset_id: z.string(),
      type: z.literal("reference_frame")
    })
  )
});

const BulkRendersRunShotOverrideSchema = z.union([
  BulkRendersRunShotSuppliedFrameOverrideSchema,
  BulkRendersRunShotGeneratedFrameOverrideSchema
]);

type BulkRendersRunShotOverride = z.infer<
  typeof BulkRendersRunShotOverrideSchema
>;

export const CreateBulkRendersRunRequestSchema = z.object({
  project_id: z.string(),
  timeline_ids: z.array(z.string()).min(1),
  img2img_settings: BulkRendersRunSettingsSchema.optional(),
  video_settings: BulkRendersRunSettingsSchema.optional(),
  name: z.string().max(BULK_RENDERS_RUN_NAME_MAX_UTF16_LENGTH).optional(),
  shot_overrides: z
    .record(z.string(), BulkRendersRunShotOverrideSchema)
    .optional()
});

export type CreateBulkRendersRunRequest = z.infer<
  typeof CreateBulkRendersRunRequestSchema
>;

const BulkRendersRunStepSchema = z.looseObject({
  id: z.string(),
  plan_id: z.string(),
  timeline_id: z.string().nullable().default(null),
  step_order: z.number(),
  tool_name: z.string(),
  status: BulkRendersRunStepStatusSchema,
  result: z.unknown().nullable().default(null),
  error: z.unknown().nullable().default(null),
  retry_count: z.number().nullable().default(null),
  started_at: z.string().nullable().default(null),
  finished_at: z.string().nullable().default(null)
});

export type BulkRendersRunStep = z.infer<typeof BulkRendersRunStepSchema>;

export const BulkRendersRunStepListSchema = z.array(BulkRendersRunStepSchema);

const BulkRendersRunInputSettingsSchema = z.looseObject({
  img2img_settings: BulkRendersRunSettingsSchema.nullish(),
  video_settings: BulkRendersRunSettingsSchema.nullish(),
  timeline_ids: z.array(z.string()).default([])
});

type BulkRendersRunInputSettings = z.infer<
  typeof BulkRendersRunInputSettingsSchema
>;

const BulkRendersRunStatsSchema = z
  .looseObject({
    total_amount_of_runs: z.number().nullable().default(null),
    total_amount_of_evaluated_runs: z.number().nullable().default(null),
    total_amount_of_quality_passed_runs: z.number().nullable().default(null),
    quality_success_rate: z.number().nullable().default(null),
    attention_count: z.number().nullable().default(null)
  })
  .nullable();

export const BulkRendersRunSchema = z.looseObject({
  id: z.string(),
  status: BulkRendersRunStatusSchema,
  name: z.string().nullable().default(null),
  project_id: z.string().nullable().default(null),
  parent_plan_id: z.string().nullable().default(null),
  error: z.unknown().nullable().default(null),
  created_at: z.string().nullable().default(null),
  input_settings: BulkRendersRunInputSettingsSchema.nullish(),
  total_steps: z.number().default(0),
  completed_steps: z.number().default(0),
  progress_pct: z.number().default(0),
  current_step: BulkRendersRunStepSchema.nullish(),
  stats: BulkRendersRunStatsSchema.default(null)
});

export type BulkRendersRun = z.infer<typeof BulkRendersRunSchema>;

export const BulkRendersRunImageStepResultSchema = z.looseObject({
  asset_id: z.string()
});

export const BulkRendersRunVideoResultAssetStepResultSchema = z.looseObject({
  render_asset_id: z.string(),
  fps: z.number().optional(),
  output_url: z.string().optional(),
  poster_asset_id: z.string().optional(),
  poster_url: z.string().optional()
});

const BulkRendersRunVideoMetricsSchema = z.looseObject({
  status: z.string().optional(),
  vid_pass: z.boolean().optional()
});

export const BulkRendersRunVideoMetricsStepResultSchema = z.looseObject({
  video_metrics: BulkRendersRunVideoMetricsSchema
});

export const BulkRendersRunVideoReferenceFrameStepResultSchema = z.looseObject({
  ref_frame_asset_id: z.string()
});

const BulkRendersRunDetailImg2ImgSettingsSchema = z.looseObject({
  prompt: z.string().optional(),
  render_model: z.string().optional(),
  reference_images: z.array(z.string()).optional()
});

export type BulkRendersRunDetailImg2ImgSettings = z.infer<
  typeof BulkRendersRunDetailImg2ImgSettingsSchema
>;

const BulkRendersRunDetailVideoSettingsSchema = z.looseObject({
  prompt: z.string().optional(),
  engine: z.string().optional()
});

export type BulkRendersRunDetailVideoSettings = z.infer<
  typeof BulkRendersRunDetailVideoSettingsSchema
>;

const BulkRendersRunDetailShotOverrideSchema = z.looseObject({
  img2img_settings: BulkRendersRunDetailImg2ImgSettingsSchema.optional(),
  video_settings: BulkRendersRunDetailVideoSettingsSchema.optional()
});

export type BulkRendersRunDetailShotOverride = z.infer<
  typeof BulkRendersRunDetailShotOverrideSchema
>;

const BulkRendersRunDetailInputDataSchema = z.looseObject({
  img2img_settings: BulkRendersRunDetailImg2ImgSettingsSchema.nullish(),
  video_settings: BulkRendersRunDetailVideoSettingsSchema.nullish(),
  shot_overrides: z
    .record(z.string(), BulkRendersRunDetailShotOverrideSchema)
    .nullish()
});

export const BulkRendersRunDetailSchema = z.looseObject({
  id: z.string(),
  started_at: z.string().nullable().default(null),
  finished_at: z.string().nullable().default(null),
  input_data: BulkRendersRunDetailInputDataSchema.nullish()
});

export type BulkRendersRunDetail = z.infer<typeof BulkRendersRunDetailSchema>;
