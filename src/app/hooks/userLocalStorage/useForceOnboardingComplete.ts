import { useLocalStorage } from "usehooks-ts";

import { useIsRawTeamMember } from "./useIsRawTeamMember";

const FORCE_ONBOARDING_COMPLETE_KEY = "mago_dev_force_onboarding_complete";

export const useForceOnboardingComplete = (): boolean => {
  const isRawTeamMember = useIsRawTeamMember();
  const [forceComplete] = useLocalStorage<boolean>(
    FORCE_ONBOARDING_COMPLETE_KEY,
    false
  );

  return isRawTeamMember && forceComplete;
};
