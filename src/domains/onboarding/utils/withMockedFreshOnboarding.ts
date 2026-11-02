import { Balance } from "@schemas/balance";

export const withMockedFreshOnboarding = (balance: Balance): Balance => ({
  ...balance,
  onboarding: {
    img2img_success: balance.onboarding?.img2img_success ?? 0,
    video_success: balance.onboarding?.video_success ?? 0,
    img2img_remaining: balance.onboarding?.img2img_remaining ?? 0,
    video_remaining: balance.onboarding?.video_remaining ?? 0,
    completed: false
  },
  renders_in_progress: {
    credits: {
      ...balance.renders_in_progress.credits,
      video: 0,
      video_ids: []
    },
    unlimited: {
      ...balance.renders_in_progress.unlimited,
      video: 0,
      video_ids: []
    }
  }
});
