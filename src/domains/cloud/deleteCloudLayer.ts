import { backendApiClient } from "@/lib/backend-api-client";

export const deleteCloudLayer = async (cloudLayerId: string): Promise<void> => {
  await backendApiClient.delete(`/layers/${cloudLayerId}`);
};
