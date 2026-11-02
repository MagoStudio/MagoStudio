import { Project, ProjectSchema } from "@schemas/project";

import { backendApiClient } from "@/lib/backend-api-client";

export async function fetchProject(projectId: Project["id"] | undefined) {
  if (!projectId) {
    return undefined;
  }
  const response = window.mago
    ? await window.mago.projects.get(projectId)
    : (await backendApiClient.get<Project>(`/projects/${projectId}`)).data;
  if (!response) return undefined;

  const parsedData = ProjectSchema.safeParse(response);
  if (!parsedData.success) {
    console.error("Failed to parse project data:", parsedData.error);
    return response as Project;
  }

  return parsedData.data;
}
