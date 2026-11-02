import { syncCloudProjectMetadata } from "@domains/scriptProject/syncCloudScriptProjects";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";

import { isCloudProject } from "../utils/isCloudProject";

/** `projectId` tells a cloud project's shot (deleted in the cloud, then
 * mirrored) from a local one; without it the desktop app assumes local. */
export const deleteTimeline = async (
  timelineId: string,
  projectId?: string
) => {
  if (isLocalApp && !(await isCloudProject(projectId))) {
    await getLocalDesktopApi().shots.delete(timelineId);
    return;
  }
  await backendApiClient.delete(`/timeline/${timelineId}`);
  if (projectId) await syncCloudProjectMetadata(projectId);
};
