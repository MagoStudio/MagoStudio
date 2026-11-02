import { getLocalDesktopApi } from "@/platform/localDesktop";

import type { LocalProjectListItem } from "../../../desktop/shared/contracts";

import { fetchIsCloudMirrorProject } from "./fetchIsCloudMirrorProject";

export const removeImportedCloudMirrorProjects = async ({
  libraryProjects,
  catalogCloudProjectIds,
  signal
}: {
  libraryProjects: LocalProjectListItem[];
  catalogCloudProjectIds: ReadonlySet<string>;
  signal: AbortSignal;
}): Promise<void> => {
  const desktop = getLocalDesktopApi();
  const importedCloudProjectsMissingFromCatalog = libraryProjects.filter(
    (project) =>
      project.origin === "cloud" && !catalogCloudProjectIds.has(project.id)
  );
  for (const project of importedCloudProjectsMissingFromCatalog) {
    if (signal.aborted) return;
    if (!(await fetchIsCloudMirrorProject(project.id, signal))) continue;
    await desktop.projects.delete(project.id);
  }
};
