import { backendCloudApi } from "@domains/cloud/backendCloudApi";
import { ensureCloudImageAsset } from "@domains/cloud/mirrorService";
import {
  SheetGroup,
  SheetGroupSchema,
  SheetKind
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";

export type AddSheetGroupImageRequest = {
  projectId?: string;
  timelineId: string;
  token: string;
  assetId: string;
  name?: string;
  kind?: SheetKind;
};

export const postSheetGroupImage = async (
  request: AddSheetGroupImageRequest
): Promise<SheetGroup> => {
  if (request.projectId && (await isLocalScriptProject(request.projectId))) {
    return SheetGroupSchema.parse(
      await getLocalDesktopApi().scriptProjects.update({
        projectId: request.projectId,
        operation: "add-sheet-image",
        payload: {
          token: request.token,
          assetId: request.assetId,
          ...(request.name ? { name: request.name } : {})
        }
      })
    );
  }
  const cloudAssetId = await ensureCloudImageAsset(
    backendCloudApi(),
    request.assetId,
    request.projectId
  );
  const response = await backendApiClient.post(
    `/timelines/${request.timelineId}/sheets/${encodeURIComponent(request.token)}/images`,
    {
      asset_id: cloudAssetId,
      ...(request.name ? { name: request.name } : {}),
      ...(request.kind ? { kind: request.kind } : {})
    }
  );
  return SheetGroupSchema.parse(response.data);
};
