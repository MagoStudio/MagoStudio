import { backendApiClient } from "@/lib/backend-api-client";

import { isLocalScriptProject } from "../projectOrigin";

export type DescribeSheetGroupRequest = {
  projectId?: string;
  timelineId: string;
  token: string;
  assetId?: string;
  shouldOverwrite?: boolean;
};

export const postDescribeSheetGroup = async (
  request: DescribeSheetGroupRequest
): Promise<void> => {
  if (request.projectId && (await isLocalScriptProject(request.projectId))) {
    await window.mago.scriptProjects.update({
      projectId: request.projectId,
      operation: "describe-sheet",
      payload: {
        token: request.token,
        ...(request.assetId ? { assetId: request.assetId } : {}),
        ...(request.shouldOverwrite ? { shouldOverwrite: true } : {})
      }
    });
    return;
  }
  await backendApiClient.post(
    `/timelines/${request.timelineId}/sheets/${encodeURIComponent(request.token)}/describe`,
    {
      ...(request.assetId ? { asset_id: request.assetId } : {}),
      ...(request.shouldOverwrite ? { overwrite: true } : {})
    }
  );
};
