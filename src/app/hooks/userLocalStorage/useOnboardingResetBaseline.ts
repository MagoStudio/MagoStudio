import { useLocalStorage } from "usehooks-ts";

import { useIsRawTeamMember } from "./useIsRawTeamMember";

const ONBOARDING_RESET_BASELINE_KEY = "mago_dev_onboarding_reset_baseline";

export const useOnboardingResetBaseline = (): string[] => {
  const isRawTeamMember = useIsRawTeamMember();
  const [baseline] = useLocalStorage<string[]>(
    ONBOARDING_RESET_BASELINE_KEY,
    []
  );

  return isRawTeamMember ? baseline : [];
};
