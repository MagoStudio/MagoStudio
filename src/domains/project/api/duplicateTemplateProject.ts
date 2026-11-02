import { Project, ProjectSchema } from "@schemas/project";

import { backendApiClient } from "@/lib/backend-api-client";

export const duplicateTemplateProject = async (
  templateId: string
): Promise<Project> => {
  const response = await backendApiClient.get<Project>(
    `/projects/duplicate/template/${templateId}`
  );

  const parsedData = ProjectSchema.safeParse(response.data);
  if (!parsedData.success) {
    console.error(
      "Failed to parse duplicated template project:",
      parsedData.error
    );
    return response.data;
  }

  return parsedData.data;
};
