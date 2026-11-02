import {
  SheetGroup,
  SheetGroupSchema,
  SheetKind
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

export type AddSheetGroupImageRequest = {
  projectId?: string;
  timelineId: string;
  token: string;
  assetId: string;
  /** Used only when the token creates the group. */
  name?: string;
  kind?: SheetKind;
};

/** Files an already-uploaded image into an entity's group as a new version.
 * Creates the group when the token is new, like a render with a fresh `sheet_token` does. */
export const postSheetGroupImage = async ({
  timelineId,
  token,
  assetId,
  name,
  kind
}: AddSheetGroupImageRequest): Promise<SheetGroup> => {
  const response = await backendApiClient.post(
    `/timelines/${timelineId}/sheets/${encodeURIComponent(token)}/images`,
    {
      asset_id: assetId,
      ...(name ? { name } : {}),
      ...(kind ? { kind } : {})
    }
  );
  return SheetGroupSchema.parse(response.data);
};
