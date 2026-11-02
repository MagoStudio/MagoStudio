import { appendImageTagsToPrompt } from "@models/video/appendImageTagsToPrompt";

import {
  ONBOARDING_PROMPT_INPUT_SLOT,
  ONBOARDING_VIDEO_PROMPT_TEMPLATE
} from "../constants";

export const buildOnboardingVideoPrompt = (
  userInput: string,
  imageIds: string[] = []
): string => {
  const basePrompt = ONBOARDING_VIDEO_PROMPT_TEMPLATE.replace(
    ONBOARDING_PROMPT_INPUT_SLOT,
    () => `"${userInput.trim()}"`
  );
  return appendImageTagsToPrompt(imageIds, basePrompt) ?? basePrompt;
};
