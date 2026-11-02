import { getLocalDesktopApi } from "@/platform/localDesktop";

import type { LocalProjectListItem } from "../../../desktop/shared/contracts";

import { isCloudResourceAlreadyGoneError } from "./isCloudResourceAlreadyGoneError";
import { markCloudMirrorProject } from "./markCloudMirrorProject";

export const markLinkedCloudMirrorProjects = async ({
  libraryProjects,
  signal
}: {
  libraryProjects: LocalProjectListItem[];
  signal: AbortSignal;
}): Promise<void> => {
  const desktop = getLocalDesktopApi();
  const localProjects = libraryProjects.filter(
    (project) => project.origin !== "cloud"
  );
  for (const localProject of localProjects) {
    if (signal.aborted) return;
    const link = await desktop.cloud.links.get("project", localProject.id);
    if (
      !link ||
      link.cloudId === localProject.id ||
      link.data.isCloudProjectMarkedAsMirror === true
    )
      continue;
    try {
      await markCloudMirrorProject({
        localProjectId: localProject.id,
        cloudProjectId: link.cloudId,
        signal
      });
    } catch (err) {
      if (signal.aborted) return;
      if (isCloudResourceAlreadyGoneError(err)) continue;
      console.warn(
        `Failed to mark cloud project ${link.cloudId} as the mirror of ${localProject.id}`,
        err
      );
    }
  }
};
