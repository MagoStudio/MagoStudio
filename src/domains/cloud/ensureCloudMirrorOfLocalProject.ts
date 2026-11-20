import { getLocalDesktopApi } from "@/platform/localDesktop";

import { CloudApi, ensureCloudProject } from "./mirrorService";

export const ensureCloudMirrorOfLocalProject = async (
  api: CloudApi,
  localProjectId: string
): Promise<string> => {
  const localProject = await getLocalDesktopApi().projects.get(localProjectId);
  if (!localProject) throw new Error("Local project not found");
  return ensureCloudProject(api, {
    localProjectId,
    name: localProject.name
  });
};
