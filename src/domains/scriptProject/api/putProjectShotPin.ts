import { ShotPin, ShotPinSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

export type PinProjectShotRequest = {
  projectId: string;
  timelineId: string;
  selectedAssetId: string | null;
};

export const putProjectShotPin = async ({
  projectId,
  timelineId,
  selectedAssetId
}: PinProjectShotRequest): Promise<ShotPin> => {
  const response = await backendApiClient.put(
    `/projects/${projectId}/shots/${timelineId}/pin`,
    { selected_asset_id: selectedAssetId }
  );
  return ShotPinSchema.parse(response.data);
};
