import { useLocalStorage } from "usehooks-ts";

import { useIsRawTeamMember } from "./useIsRawTeamMember";

const MOCK_ONBOARDING_INCOMPLETE_KEY = "mago_dev_mock_onboarding_incomplete";

export const useMockOnboardingIncomplete = (): boolean => {
  const isRawTeamMember = useIsRawTeamMember();
  const [mockIncomplete] = useLocalStorage<boolean>(
    MOCK_ONBOARDING_INCOMPLETE_KEY,
    false
  );

  return isRawTeamMember && mockIncomplete;
};
