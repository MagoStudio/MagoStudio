import { ProjectState, ProjectStateSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";
import {
  readScriptProjectSnapshot,
  writeScriptProjectSnapshot
} from "../scriptProjectSnapshot";

export const getProjectState = async (
  projectId: string,
  options: { preferCache?: boolean } = {}
): Promise<ProjectState> => {
  const desktop = getLocalDesktopApi();
  const isLocal = await isLocalScriptProject(projectId);
  const cached = (await readScriptProjectSnapshot(projectId))?.state;
  // A local project's SQLite snapshot is its source of truth, not a cache of
  // a cloud response. Background cloud-list invalidations may request a fresh
  // read, but they must never make a local project discard its persisted
  // state.
  if (cached && (isLocal || options.preferCache !== false)) {
    return ProjectStateSchema.parse(cached);
  }
  if (!isLocal && desktop.account.mode === "cloud") {
    try {
      const response = await backendApiClient.get(
        `/projects/${projectId}/state`
      );
      const state = ProjectStateSchema.parse(response.data);
      await writeScriptProjectSnapshot({ projectId, state });
      return ProjectStateSchema.parse(
        (await readScriptProjectSnapshot(projectId))?.state ?? state
      );
    } catch (error) {
      if (cached) return ProjectStateSchema.parse(cached);
      throw error;
    }
  }
  throw new Error(
    isLocal
      ? "Cast the script to create the local project state"
      : "This script project has not been mirrored yet"
  );
};
