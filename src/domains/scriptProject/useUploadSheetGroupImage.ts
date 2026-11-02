import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { SheetKind } from "@schemas/scriptProject";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAddSheetGroupImage } from "./data/useAddSheetGroupImage";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";
import { readUploadRejectionMessage } from "./utils/readUploadRejectionMessage";

/** Upload a file, then file the resulting asset into an entity's group as a new version. */
export const useUploadSheetGroupImage = (projectId: string) => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();
  const { mutateAsync: uploadReferenceImage } = useUploadReferenceImage();
  const { mutateAsync: addSheetGroupImage, isPending: isFilingImage } =
    useAddSheetGroupImage(projectId);
  const [pendingFileUploadCount, setPendingFileUploadCount] = useState(0);

  const uploadSheetGroupImage = async ({
    timelineId,
    token,
    file,
    nameForNewSheetGroup,
    kindForNewSheetGroup
  }: {
    timelineId: string;
    token: string;
    file: File;
    nameForNewSheetGroup?: string;
    kindForNewSheetGroup?: SheetKind;
  }) => {
    setPendingFileUploadCount((count) => count + 1);
    let fileUploadFailure: unknown;
    try {
      const assetId = await uploadReferenceImage({
        file,
        projectId,
        onError: (error) => {
          fileUploadFailure = error;
        }
      });
      if (!assetId) {
        throw fileUploadFailure instanceof Error
          ? fileUploadFailure
          : new Error("Image upload failed");
      }

      await addSheetGroupImage({
        timelineId,
        token,
        assetId,
        name: nameForNewSheetGroup,
        kind: kindForNewSheetGroup
      });
    } catch (error) {
      reportScriptProjectFailure(
        error,
        readUploadRejectionMessage(error) ??
          t("script_project.upload_entity_image_failed.description"),
        () =>
          void uploadSheetGroupImage({
            timelineId,
            token,
            file,
            nameForNewSheetGroup,
            kindForNewSheetGroup
          })
      );
    } finally {
      setPendingFileUploadCount((count) => count - 1);
    }
  };

  return {
    uploadSheetGroupImage,
    isUploadingSheetGroupImage: pendingFileUploadCount > 0 || isFilingImage
  };
};
