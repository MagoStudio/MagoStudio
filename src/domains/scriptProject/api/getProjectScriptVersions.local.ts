import {
  ScriptVersionList,
  ScriptVersionListSchema
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";
import {
  readScriptProjectSnapshot,
  writeScriptProjectSnapshot
} from "../scriptProjectSnapshot";

export const getProjectScriptVersions = async (
  projectId: string,
  options: { preferCache?: boolean } = {}
): Promise<ScriptVersionList> => {
  const desktop = getLocalDesktopApi();
  const isLocal = await isLocalScriptProject(projectId);
  const cached = (await readScriptProjectSnapshot(projectId))?.scriptVersions;
  // For a local project this snapshot is authoritative. `preferCache: false`
  // only means "refresh from cloud" when the project itself came from cloud.
  if (cached && (isLocal || options.preferCache !== false)) {
    return ScriptVersionListSchema.parse(cached);
  }
  if (!isLocal && desktop.account.mode === "cloud") {
    try {
      const response = await backendApiClient.get(
        `/projects/${projectId}/script`
      );
      const scriptVersions = ScriptVersionListSchema.parse(response.data);
      void writeScriptProjectSnapshot({ projectId, scriptVersions });
      return scriptVersions;
    } catch (error) {
      if (cached) return ScriptVersionListSchema.parse(cached);
      throw error;
    }
  }
  if (isLocal) return { active_version: null, versions: [] };
  throw new Error("This script project has not been mirrored yet");
};
