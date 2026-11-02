import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";

export function useIsBulkRenderingAvailableForUser() {
  return useIsTeamMember();
}
