import { useToast } from "@store/useToast";
import { useTranslation } from "react-i18next";

import { useDescribeSheetGroup } from "./data/useDescribeSheetGroup";
import { isLocalScriptProject } from "./projectOrigin";

export const useDescribeUploadedSheetImage = (projectId: string) => {
  const { t } = useTranslation();
  const { showErrorToast } = useToast();
  const showCaptionFailedToast = () =>
    showErrorToast({
      message: t(
        "script_project.upload_entity_image_caption_failed.description"
      )
    });
  const { mutate: describeSheetGroup } = useDescribeSheetGroup(projectId, {
    onError: showCaptionFailedToast
  });

  return async ({
    timelineId,
    token,
    assetId
  }: {
    timelineId: string;
    token: string;
    assetId: string;
  }) => {
    try {
      const isUploadDescribedByMagoStudio =
        await isLocalScriptProject(projectId);
      if (!isUploadDescribedByMagoStudio) return;
    } catch {
      showCaptionFailedToast();
      return;
    }
    describeSheetGroup({ timelineId, token, assetId });
  };
};
