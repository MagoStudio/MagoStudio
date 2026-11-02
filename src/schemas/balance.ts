import { z } from "zod";

export enum SubscriptionType {
  FREE = "free",
  UNLIMITED_BASIC = "unlimited_basic",
  UNLIMITED_PRO = "unlimited_pro",
  UNLIMITED_PRO_ANNUAL = "unlimited_pro_annual",
  UNLIMITED_STUDIO = "studio",
  UNLIMITED_STUDIO_ANNUAL = "studio_annual"
}
export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELED = "canceled",
  PAST_DUE = "past_due",
  INCOMPLETE_EXPIRED = "incomplete_expired"
}

export enum RelaxedModeType {
  UNLIMITED = "unlimited",
  RELAXED = "relaxed"
}

export const SubscriptionFeatures = z.object({
  annual: z.boolean().optional(),
  archived: z.boolean().optional(),
  hidden: z.boolean().optional(),
  title: z.union([z.enum(SubscriptionType), z.literal("")]).optional(),
  simultaneous_image_renders: z.number().optional(),
  simultaneous_video_renders: z.number().optional(),
  maximum_frame_range: z.number().optional(),
  relaxed_mode_type: z.enum(RelaxedModeType).nullable().optional(),
  relaxed_allowed_models: z.array(z.string()).optional()
});

const LatestSubscriptionSchema = z.object({
  id: z.string().nullable(),
  price_id: z.string().nullable(),
  price_amount: z.number(),
  price_currency: z.string(),
  credits: z.number(),
  current_period_end: z.number(),
  current_period_start: z.number(),
  cancel_at_period_end: z.boolean(),
  features: SubscriptionFeatures,
  schedule: z.object({
    target_price_id: z.string().optional(),
    target_start_date: z.number().optional()
  }),
  status: z.enum(SubscriptionStatus).nullable()
});

export type LatestSubscription = z.infer<typeof LatestSubscriptionSchema>;

const RendersInProgressShema = z.object({
  img2img: z.number(),
  img2img_ids: z.array(z.string()),
  last_img2img_render_at: z.number(),
  video: z.number(),
  video_ids: z.array(z.string())
});
export type RendersInProgress = z.infer<typeof RendersInProgressShema>;

const RelaxedUsageSchema = z.object({
  day_used_pct: z.number().optional(),
  week_used_pct: z.number().optional(),
  day_reset_at: z.number().optional(),
  week_reset_at: z.number().optional()
});
export type RelaxedUsage = z.infer<typeof RelaxedUsageSchema>;

const OnboardingStatusSchema = z.object({
  img2img_success: z.number(),
  video_success: z.number(),
  img2img_remaining: z.number(),
  video_remaining: z.number(),
  completed: z.boolean()
});
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;

export const BalanceSchema = z.object({
  amount: z.number(),
  reserved_amount: z.number(),
  group_id: z.string().nullable().optional(),
  latest_subscription: LatestSubscriptionSchema,
  relaxed_usage: RelaxedUsageSchema.nullable().optional(),
  onboarding: OnboardingStatusSchema.nullable().optional(),
  renders_in_progress: z.object({
    credits: RendersInProgressShema,
    unlimited: RendersInProgressShema
  })
});

export type Balance = z.infer<typeof BalanceSchema>;
