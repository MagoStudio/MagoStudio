import { useLocalStorage } from "usehooks-ts";

import { useIsRawTeamMember } from "./useIsRawTeamMember";

const FORCE_NON_TEAM_MEMBER_KEY = "mago_dev_force_non_team_member_override";

export const useIsTeamMember = () => {
  const isRawTeamMember = useIsRawTeamMember();
  const [forceNonTeamMember] = useLocalStorage<boolean>(
    FORCE_NON_TEAM_MEMBER_KEY,
    false
  );

  if (isRawTeamMember && forceNonTeamMember) return false;

  return isRawTeamMember;
};
