import { backendApiClient } from "@/lib/backend-api-client";

export type DescribeSheetGroupRequest = {
  projectId?: string;
  timelineId: string;
  token: string;
  /** Describes this specific version instead of the group's pinned/effective image. */
  assetId?: string;
  /** Replace text the user already wrote. Off by default — the backend never overwrites
   * otherwise, so a plain call only fills a blank description. */
  shouldOverwrite?: boolean;
};

export const postDescribeSheetGroup = async ({
  timelineId,
  token,
  assetId,
  shouldOverwrite
}: DescribeSheetGroupRequest): Promise<void> => {
  await backendApiClient.post(
    `/timelines/${timelineId}/sheets/${encodeURIComponent(token)}/describe`,
    {
      ...(assetId ? { asset_id: assetId } : {}),
      ...(shouldOverwrite ? { overwrite: true } : {})
    }
  );
};
