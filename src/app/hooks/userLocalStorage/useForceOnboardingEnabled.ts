import { useLocalStorage } from "usehooks-ts";

import { useIsRawTeamMember } from "./useIsRawTeamMember";

export const FORCE_ONBOARDING_ENABLED_KEY = "mago_dev_force_onboarding_enabled";

export const useForceOnboardingEnabled = (): boolean => {
  const isRawTeamMember = useIsRawTeamMember();
  const [forceEnabled] = useLocalStorage<boolean>(
    FORCE_ONBOARDING_ENABLED_KEY,
    false
  );

  return isRawTeamMember && forceEnabled;
};
