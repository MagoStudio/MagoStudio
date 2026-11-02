export const ONBOARDING_PROMPT_INPUT_SLOT = "{{input}}";

export const ONBOARDING_VIDEO_PROMPT_TEMPLATE = `@video1 = source video
Do not change:
Camera movement and path
Composition and framing
Lighting direction and intensity
Scene structure and depth

TRANSFORM:
${ONBOARDING_PROMPT_INPUT_SLOT}

NEGATIVE:
Do not alter camera angle, do not add new camera moves,
do not change composition, do not relight the scene,
no added motion blur, no flickering, no distorted faces`;

export const ONBOARDING_MAX_IMAGE_GENERATIONS = 4;

export const ONBOARDING_RENDER_DURATION_SECONDS = 3.2;

export const ONBOARDING_TUTORIAL_VIDEO_ID = "n21xsvNfKvU";

export const ONBOARDING_DIAGNOSTICS_HISTORY_LOG_KEY =
  "mago_onboarding_diag_history_log";
export const ONBOARDING_DIAGNOSTICS_RELOAD_COUNT_KEY =
  "mago_onboarding_diag_reload_count";

export const ONBOARDING_PROJECT_NAME = "Onboarding";

export const ONBOARDING_TEMPLATE_ID = "0";

export type OnboardingTemplatePreview = {
  shotName: string;
  thumbnail: string;
};

export const ONBOARDING_TEMPLATE_PREVIEWS: OnboardingTemplatePreview[] = [
  { shotName: "romantic", thumbnail: "/onboarding-templates/couple.jpg" },
  { shotName: "golf", thumbnail: "/onboarding-templates/golf-cart.jpg" },
  { shotName: "car", thumbnail: "/onboarding-templates/sunset-car.jpg" },
  { shotName: "walking_people", thumbnail: "/onboarding-templates/hikers.jpg" }
];
