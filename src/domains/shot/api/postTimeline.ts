import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";

import { isCloudProject } from "../utils/isCloudProject";

export const postTimeline = async (projectId: string, name: string) => {
  if (isLocalApp && !(await isCloudProject(projectId))) {
    return getLocalDesktopApi().shots.create({ projectId, name });
  }
  const response = await backendApiClient.post(`/timelines/${projectId}`, {
    name
  });
  return response.data;
};
