import { ProjectState, ProjectStateSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

export const getProjectState = async (
  projectId: string,
  _options: { preferCache?: boolean } = {}
): Promise<ProjectState> => {
  const response = await backendApiClient.get(`/projects/${projectId}/state`);
  return ProjectStateSchema.parse(response.data);
};
