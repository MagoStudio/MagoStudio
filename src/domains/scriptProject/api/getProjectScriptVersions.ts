import {
  ScriptVersionList,
  ScriptVersionListSchema
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

export const getProjectScriptVersions = async (
  projectId: string,
  _options: { preferCache?: boolean } = {}
): Promise<ScriptVersionList> => {
  const response = await backendApiClient.get(`/projects/${projectId}/script`);
  return ScriptVersionListSchema.parse(response.data);
};
