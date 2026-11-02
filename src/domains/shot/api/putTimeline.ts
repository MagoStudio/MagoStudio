import { syncCloudProjectMetadata } from "@domains/scriptProject/syncCloudScriptProjects";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";

import { isCloudProject } from "../utils/isCloudProject";

export const putTimeline = async (
  timelineId: string,
  data: { name: string; settings: object | null; project_id: string }
) => {
  if (isLocalApp && !(await isCloudProject(data.project_id))) {
    return getLocalDesktopApi().shots.update({
      shotId: timelineId,
      name: data.name,
      settings: (data.settings ?? {}) as Record<string, unknown>
    });
  }
  const response = await backendApiClient.put(`/timeline/${timelineId}`, data);
  await syncCloudProjectMetadata(data.project_id);
  return response.data;
};
