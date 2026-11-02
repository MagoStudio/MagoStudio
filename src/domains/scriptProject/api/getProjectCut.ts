import { ProjectCut, ProjectCutSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

export const getProjectCut = async (
  projectId: string,
  _options: { preferCache?: boolean } = {}
): Promise<ProjectCut> => {
  const response = await backendApiClient.get(`/projects/${projectId}/cut`);
  return ProjectCutSchema.parse(response.data);
};
