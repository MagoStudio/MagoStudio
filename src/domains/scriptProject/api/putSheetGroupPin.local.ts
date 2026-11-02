import { SheetGroup, SheetGroupSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";

export type PinSheetGroupImageRequest = {
  projectId?: string;
  timelineId: string;
  token: string;
  selectedAssetId: string | null;
};

export const putSheetGroupPin = async (
  request: PinSheetGroupImageRequest
): Promise<SheetGroup> => {
  if (request.projectId && (await isLocalScriptProject(request.projectId))) {
    return SheetGroupSchema.parse(
      await getLocalDesktopApi().scriptProjects.update({
        projectId: request.projectId,
        operation: "pin-sheet",
        payload: {
          token: request.token,
          selectedAssetId: request.selectedAssetId
        }
      })
    );
  }
  const response = await backendApiClient.put(
    `/timelines/${request.timelineId}/sheets/${encodeURIComponent(request.token)}`,
    { selected_asset_id: request.selectedAssetId }
  );
  return SheetGroupSchema.parse(response.data);
};
