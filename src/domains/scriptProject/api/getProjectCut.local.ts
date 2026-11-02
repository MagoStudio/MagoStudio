import { ProjectCut, ProjectCutSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";
import {
  readScriptProjectSnapshot,
  writeScriptProjectSnapshot
} from "../scriptProjectSnapshot";

export const getProjectCut = async (
  projectId: string,
  options: { preferCache?: boolean } = {}
): Promise<ProjectCut> => {
  const desktop = getLocalDesktopApi();
  const isLocal = await isLocalScriptProject(projectId);
  const cached = (await readScriptProjectSnapshot(projectId))?.cut;
  // Local rendered videos live in this durable snapshot. A generic query
  // invalidation must not replace them with the empty pre-render default.
  if (cached && (isLocal || options.preferCache !== false)) {
    return ProjectCutSchema.parse(cached);
  }
  if (!isLocal && desktop.account.mode === "cloud") {
    try {
      const response = await backendApiClient.get(`/projects/${projectId}/cut`);
      const cut = ProjectCutSchema.parse(response.data);
      await writeScriptProjectSnapshot({ projectId, cut });
      return ProjectCutSchema.parse(
        (await readScriptProjectSnapshot(projectId))?.cut ?? cut
      );
    } catch (error) {
      if (cached) return ProjectCutSchema.parse(cached);
      throw error;
    }
  }
  if (isLocal)
    return {
      project_id: projectId,
      shots: [],
      hidden_shots: [],
      missing: [],
      missing_timeline_ids: [],
      export: null
    };
  throw new Error("This script project has not been mirrored yet");
};
