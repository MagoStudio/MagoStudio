import { faker } from "@faker-js/faker";
import { VideoEngine } from "@models/video/types";
import {
  RendersInProgress,
  Balance,
  LatestSubscription,
  OnboardingStatus
} from "@schemas/balance";

/**
 * Allow-all whitelist for tests running under Relaxed/Unlimited mode.
 * Includes every raw `engine_version` (video) + `render_model` (img2img)
 * identifier — mirroring what the backend serves for a Studio-plan payload.
 * Individual tests can override `relaxed_allowed_models` to test restricted
 * or deny-all (`[]`) scenarios.
 */
export const TEST_ALL_RELAXED_MODELS: string[] = [
  ...Object.values(VideoEngine),
  "gpt_image_2",
  "nanobanana_pro",
  "nanobanana_2",
  "qwen"
];

const createOnboardingStatus = (
  overrides?: Partial<OnboardingStatus>
): OnboardingStatus => ({
  img2img_success: 0,
  video_success: 1,
  img2img_remaining: 4,
  video_remaining: 0,
  completed: true,
  ...overrides
});

export const createBalance = (overrides?: Partial<Balance>): Balance => {
  const defaultBalance: Balance = {
    amount: 57625,
    reserved_amount: 80,
    latest_subscription: createSubscription(),
    // Default to a returning user whose onboarding is already complete, so the
    // OnboardingRedirectGuard never bounces existing logged-in specs to
    // /onboarding. Onboarding specs override `onboarding` explicitly.
    onboarding: createOnboardingStatus(),
    renders_in_progress: {
      unlimited: createRenderProgress(),
      credits: createRenderProgress()
    }
  };

  return {
    ...defaultBalance,
    ...overrides
  };
};

export const createSubscription = (
  overrides?: Partial<LatestSubscription>
): LatestSubscription => {
  const defaultSubscription: LatestSubscription = {
    status: null,
    id: faker.string.uuid(),
    price_id: faker.string.uuid(),
    price_amount: 0,
    price_currency: "eur",
    credits: 0,
    current_period_end: 0,
    current_period_start: 0,
    cancel_at_period_end: false,
    features: {
      title: "",
      simultaneous_image_renders: 0,
      simultaneous_video_renders: 0,
      maximum_frame_range: 0
    },
    schedule: {}
  };

  return {
    ...defaultSubscription,
    ...overrides
  };
};

const createRenderProgress = (
  overrides?: Partial<RendersInProgress>
): RendersInProgress => {
  const defaultRenderProgress = {
    img2img: 0,
    img2img_ids: [],
    last_img2img_render_at: 0,
    video: 0,
    video_ids: []
  };

  return {
    ...defaultRenderProgress,
    ...overrides
  };
};
