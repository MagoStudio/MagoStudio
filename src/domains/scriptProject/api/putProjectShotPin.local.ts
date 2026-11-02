import { ShotPin, ShotPinSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";

export type PinProjectShotRequest = {
  projectId: string;
  timelineId: string;
  selectedAssetId: string | null;
};

export const putProjectShotPin = async (
  request: PinProjectShotRequest
): Promise<ShotPin> => {
  if (await isLocalScriptProject(request.projectId)) {
    return ShotPinSchema.parse(
      await getLocalDesktopApi().scriptProjects.update({
        projectId: request.projectId,
        operation: "pin-shot",
        payload: {
          timelineId: request.timelineId,
          selectedAssetId: request.selectedAssetId
        }
      })
    );
  }
  const response = await backendApiClient.put(
    `/projects/${request.projectId}/shots/${request.timelineId}/pin`,
    { selected_asset_id: request.selectedAssetId }
  );
  return ShotPinSchema.parse(response.data);
};
