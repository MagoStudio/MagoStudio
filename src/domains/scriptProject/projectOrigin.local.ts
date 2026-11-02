import { getLocalDesktopApi } from "@/platform/localDesktop";

export const isLocalScriptProject = async (
  projectId: string
): Promise<boolean> => {
  const desktop = getLocalDesktopApi();
  // Snapshot-only test/legacy bridges predate projects.get. Their account
  // mode still gives the safe behavior: offline never calls the backend,
  // while cloud retains refresh-with-snapshot-fallback.
  if (!desktop.projects?.get) return desktop.account.mode !== "cloud";
  const project = await desktop.projects.get(projectId);
  if (!project)
    throw new Error("Script project not found in the local library");
  return project.origin !== "cloud";
};
