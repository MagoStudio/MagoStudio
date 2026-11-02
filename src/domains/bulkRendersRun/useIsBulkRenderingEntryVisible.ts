import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { VideoModelDefinition } from "@models/video/types";

import { useIsBulkRenderingAvailableForUser } from "./useIsBulkRenderingAvailableForUser";
import { isBulkRenderingAvailableForModel } from "./utils/isBulkRenderingAvailableForModel";

export function useIsBulkRenderingEntryVisible(
  selectedModel: VideoModelDefinition
): boolean {
  const isBulkRenderingAvailableForUser = useIsBulkRenderingAvailableForUser();
  const isTeamMember = useIsTeamMember();

  return (
    isBulkRenderingAvailableForUser &&
    isBulkRenderingAvailableForModel(selectedModel, {
      isTeamMember
    })
  );
}
