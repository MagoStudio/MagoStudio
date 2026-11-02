import { backendApiClient } from "@/lib/backend-api-client";

export const fetchCloudProjectSettings = async (
  projectId: string
): Promise<Record<string, unknown> | undefined> => {
  const response = await backendApiClient.get<{
    settings?: Record<string, unknown> | null;
  }>(`/projects/${projectId}`);
  return response.data?.settings ?? undefined;
};
