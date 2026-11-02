import { VIDEO_ONLY_ENGINES, VideoEngine } from "@models/video/types";
import { z } from "zod";

export const MAX_QUALITY_RETRIES_CAP = 5;

const PlanStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "FAILED",
  "CANCELLED"
]);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

const StepStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "SKIPPED"
]);
export type StepStatus = z.infer<typeof StepStatusSchema>;

const ToolNameSchema = z.enum([
  "get_timeline_info",
  "get_project_info",
  "adapt_prompt_img",
  "submit_img2img",
  "poll_img2img",
  "submit_img_metrics",
  "poll_img_metrics",
  "img_quality_gate",
  "poll_img_retry",
  "img_quality_final",
  "create_render_layer",
  "submit_video_render",
  "poll_video_render",
  "submit_vid_metrics",
  "poll_vid_metrics",
  "vid_quality_gate",
  "poll_vid_retry",
  "poll_prev_shot_complete",
  "submit_pick_keyframes",
  "poll_pick_keyframes",
  "use_provided_reference_frame",
  "create_project",
  "create_shot",
  "shot_context",
  "submit_script_casting",
  "poll_script_casting",
  "plan_scenario_shots",
  "spawn_scenario_child",
  "poll_scenario_child",
  "submit_stitch_sheets",
  "poll_stitch_sheets",
  "submit_img2img_batch",
  "poll_img2img_batch",
  "submit_img_metrics_batch",
  "poll_img_metrics_batch",
  "batch_complete_gate",
  "poll_prev_step_complete",
  "materialise_project_state",
  "shot_video_source",
  "adapt_prompt_i2v",
  "submit_shot_video_prompt",
  "poll_shot_video_prompt",
  "submit_stitch_refs",
  "poll_stitch_refs",
  "run_summary"
]);
export type ToolName = z.infer<typeof ToolNameSchema>;

const PlanStepSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid(),
  project_id: z.string().uuid().nullable().optional(),
  timeline_id: z.string().uuid().nullable().optional(),
  step_order: z.number().int(),
  tool_name: ToolNameSchema,
  tool_args: z.record(z.string(), z.unknown()).optional(),
  status: StepStatusSchema,
  result: z.record(z.string(), z.unknown()).nullable().optional(),
  error: z
    .object({
      message: z.string(),
      traceback: z.string().optional()
    })
    .nullable()
    .optional(),
  retry_count: z.number().int().optional(),
  max_retries: z.number().int().optional(),
  started_at: z.string().nullable().optional(),
  finished_at: z.string().nullable().optional(),
  created_at: z.string().optional()
});
export type PlanStep = z.infer<typeof PlanStepSchema>;

const Img2ImgSettingsSchema = z.object({
  prompt: z.string().min(1),
  render_model: z.string().optional(),
  render_mode: z.enum(["credits", "unlimited"]).optional(),
  input_image: z.string().optional(),
  input_image_id: z.string().uuid().optional(),
  reference_images: z.array(z.string()).optional(),
  mask_image_id: z.string().optional(),
  frame: z.number().int().min(0).optional(),
  img_file_type: z.enum(["jpg", "png", "webp"]).optional(),
  negative_prompt: z.string().optional(),
  strength: z.number().min(0).max(1).optional(),
  skip_polling: z.boolean().optional(),
  skip_metrics: z.boolean().optional(),
  use_adapt_prompt: z.boolean().optional(),
  lora_name: z.string().optional(),
  lora_scale: z.number().optional(),
  max_quality_retries: z
    .number()
    .int()
    .min(0)
    .max(MAX_QUALITY_RETRIES_CAP)
    .optional()
});
export type Img2ImgSettings = z.infer<typeof Img2ImgSettingsSchema>;

const VideoSettingsSchema = z
  .object({
    engine: z.string().optional(),
    frame_range: z.tuple([z.number().int(), z.number().int()]).optional(),
    control_type: z.enum(["depth", "pose_depth", "softedge"]).optional(),
    render_mode: z.enum(["credits", "unlimited"]).optional(),
    prompt: z.string().optional(),
    steps: z.number().int().optional(),
    cfg: z.number().optional(),
    seed: z.number().int().optional(),
    max_size: z.number().int().optional(),
    negative_prompt: z.string().optional(),
    skip_polling: z.boolean().optional(),
    max_quality_retries: z
      .number()
      .int()
      .min(0)
      .max(MAX_QUALITY_RETRIES_CAP)
      .optional(),
    raw_video_cn_strength: z.number().optional()
  })
  .passthrough();
export type VideoSettings = z.infer<typeof VideoSettingsSchema>;

const SequentialShotsSchema = z.object({
  sequential_shots: z.boolean().optional(),
  label_style_refs: z.boolean().optional(),
  label_cross_shot_refs: z.boolean().optional(),
  cross_shot_prompt_suffix: z.string().nullable().optional(),
  cross_shot_metrics: z.boolean().optional(),
  keyframe_num_candidates: z.number().int().min(1).optional(),
  keyframe_num_select: z.number().int().min(1).optional()
});
export type SequentialShotsSettings = z.infer<typeof SequentialShotsSchema>;

const ShotOverrideImageSchema = z.object({
  asset_id: z.string(),
  type: z.literal("reference_frame")
});

const ShotOverrideSchema = z.object({
  images: z.array(ShotOverrideImageSchema).length(1).optional()
});
export type ShotOverride = z.infer<typeof ShotOverrideSchema>;

const PlanSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().optional(),
  status: PlanStatusSchema,
  name: z.string().nullable().optional(),
  input_data: z
    .object({
      project_id: z.string().uuid().optional(),
      timeline_ids: z.array(z.string().uuid()).optional(),
      img2img_settings: Img2ImgSettingsSchema.optional(),
      video_settings: VideoSettingsSchema.optional(),
      shot_overrides: z.record(z.string(), ShotOverrideSchema).optional()
    })
    .extend(SequentialShotsSchema.shape)
    .optional(),
  error: z
    .object({
      message: z.string(),
      step_id: z.string().uuid().optional(),
      detail: z.string().optional()
    })
    .nullable()
    .optional(),
  agent_token: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  finished_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  steps: z.array(PlanStepSchema).optional()
});
export type Plan = z.infer<typeof PlanSchema>;

// compact quality stats returned per-plan in the list. Present only
// once the plan is terminal (the worker persists it at completion); `null`
// while the plan is still running.
const PlanStatsSchema = z.object({
  total_amount_of_runs: z.number().int(),
  total_amount_of_evaluated_runs: z.number().int(),
  total_amount_of_quality_passed_runs: z.number().int(),
  quality_success_rate: z.number(),
  attention_count: z.number().int()
});

const PlanSummarySchema = z.object({
  id: z.string().uuid(),
  status: PlanStatusSchema,
  name: z.string().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  total_steps: z.number().int(),
  completed_steps: z.number().int(),
  progress_pct: z.number(),
  current_step: PlanStepSchema.nullable().optional(),
  stats: PlanStatsSchema.nullable().optional(),
  error: z
    .object({
      message: z.string(),
      reason: z.string().optional()
    })
    .nullable()
    .optional(),
  created_at: z.string()
});
export type PlanSummary = z.infer<typeof PlanSummarySchema>;

const PLAN_NAME_MAX_LENGTH = 200;

const CreatePlanRequestSchema = z
  .object({
    project_id: z.string(),
    timeline_ids: z.array(z.string()).min(1),
    img2img_settings: Img2ImgSettingsSchema.optional(),
    video_settings: VideoSettingsSchema.optional(),
    name: z.string().max(PLAN_NAME_MAX_LENGTH).optional(),
    shot_overrides: z.record(z.string(), ShotOverrideSchema).optional()
  })
  .extend(SequentialShotsSchema.shape)
  .refine(
    (data) => {
      const engine = data.video_settings?.engine;
      const isVideoOnlyEngine =
        !!engine && VIDEO_ONLY_ENGINES.has(engine as VideoEngine);
      return isVideoOnlyEngine || data.img2img_settings !== undefined;
    },
    {
      message:
        "img2img_settings is required unless the video engine is video-only",
      path: ["img2img_settings"]
    }
  );
export type CreatePlanRequest = z.infer<typeof CreatePlanRequestSchema>;

const CreateScenarioPlanRequestSchema = z.object({
  script: z.string().min(1),
  output_size: z.tuple([z.number().int(), z.number().int()]),
  max_shots: z.number().int().optional(),
  shot_duration_s: z.number().optional(),
  project_id: z.string().optional(),
  project_name: z.string().optional(),
  render_mode: z.enum(["credits", "unlimited"]).optional(),
  name: z.string().max(PLAN_NAME_MAX_LENGTH).optional()
});
export type CreateScenarioPlanRequest = z.infer<
  typeof CreateScenarioPlanRequestSchema
>;

export const ScenarioPlanCreatedSchema = z.object({
  plan_id: z.string().uuid(),
  status: PlanStatusSchema
});
export type ScenarioPlanCreated = z.infer<typeof ScenarioPlanCreatedSchema>;
