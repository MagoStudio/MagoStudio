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
  const [uploadingSheetGroupTokens, setUploadingSheetGroupTokens] = useState<
    string[]
  >([]);

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
  }): Promise<boolean> => {
    setUploadingSheetGroupTokens((tokens) => [...tokens, token]);
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
      return true;
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
      return false;
    } finally {
      setUploadingSheetGroupTokens((tokens) => {
        const finishedUploadIndex = tokens.indexOf(token);
        return tokens.filter((_, index) => index !== finishedUploadIndex);
      });
    }
  };

  return {
    uploadSheetGroupImage,
    isUploadingSheetGroupImage:
      uploadingSheetGroupTokens.length > 0 || isFilingImage,
    uploadingSheetGroupTokens
  };
};
