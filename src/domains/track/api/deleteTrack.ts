import { syncCloudProjectMetadata } from "@domains/scriptProject/syncCloudScriptProjects";
import { isTrackOwnedByCloud } from "@domains/track/utils/isTrackOwnedByCloud";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";

export const deleteTrack = async ({
  trackId,
  projectId
}: {
  trackId: string;
  projectId?: string;
}) => {
  const isTrackStoredLocally =
    isLocalApp && !(await isTrackOwnedByCloud({ projectId, trackId }));
  if (isTrackStoredLocally) {
    return getLocalDesktopApi().tracks.delete(trackId);
  }
  const response = await backendApiClient.delete(`/layers/${trackId}`);
  if (projectId) await syncCloudProjectMetadata(projectId);
  return response;
};
