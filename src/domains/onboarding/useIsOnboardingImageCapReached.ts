import { useImg2ImgHistoryClips } from "@domains/track/useImg2ImgHistoryClips";

import { ONBOARDING_MAX_IMAGE_GENERATIONS } from "./constants";
import { useIsOnboardingActive } from "./useIsOnboardingActive";

export const useIsOnboardingImageCapReached = (): boolean => {
  const isOnboardingActive = useIsOnboardingActive();
  const {
    data: { sortedClips }
  } = useImg2ImgHistoryClips();

  const consumedGenerations = sortedClips.filter(
    (clip) => clip.data.status !== "failed"
  ).length;

  return (
    isOnboardingActive &&
    consumedGenerations >= ONBOARDING_MAX_IMAGE_GENERATIONS
  );
};
