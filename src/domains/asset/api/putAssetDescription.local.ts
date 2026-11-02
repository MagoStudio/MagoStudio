import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

export type EditAssetDescriptionRequest = {
  assetId: string;
  description: string;
};

/** A local sheet image keeps its description in the project snapshot; any
 * other id is a cloud asset. */
export const putAssetDescription = async ({
  assetId,
  description
}: EditAssetDescriptionRequest): Promise<void> => {
  const desktop = getLocalDesktopApi();
  const media = await desktop.scriptProjects.findMedia({ assetId });
  if (media?.kind === "sheet-image") {
    await desktop.scriptProjects.update({
      projectId: media.projectId,
      operation: "edit-image-description",
      payload: { assetId, description }
    });
    return;
  }
  await backendApiClient.put(`/assets/${encodeURIComponent(assetId)}`, {
    description
  });
};
