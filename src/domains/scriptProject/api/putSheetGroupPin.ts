import { SheetGroup, SheetGroupSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

export type PinSheetGroupImageRequest = {
  projectId?: string;
  timelineId: string;
  token: string;
  selectedAssetId: string | null;
};

export const putSheetGroupPin = async ({
  timelineId,
  token,
  selectedAssetId
}: PinSheetGroupImageRequest): Promise<SheetGroup> => {
  const response = await backendApiClient.put(
    `/timelines/${timelineId}/sheets/${encodeURIComponent(token)}`,
    { selected_asset_id: selectedAssetId }
  );
  return SheetGroupSchema.parse(response.data);
};
