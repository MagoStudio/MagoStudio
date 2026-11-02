import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { useTranslation } from "react-i18next";

import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";
import { readUploadRejectionMessage } from "./utils/readUploadRejectionMessage";

export const useUploadSheetGroupReference = (projectId: string) => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();
  const { mutateAsync: uploadReferenceImage } = useUploadReferenceImage();

  return async (file: File): Promise<string | undefined> => {
    let fileUploadFailure: unknown;
    try {
      const assetId = await uploadReferenceImage({
        file,
        projectId,
        onError: (error) => {
          fileUploadFailure = error;
        }
      });
      if (assetId) return assetId;
    } catch (error) {
      fileUploadFailure = error;
    }

    const failure =
      fileUploadFailure instanceof Error
        ? fileUploadFailure
        : new Error("Reference image upload failed");
    reportScriptProjectFailure(
      failure,
      readUploadRejectionMessage(failure) ??
        t("script_project.upload_reference_failed.description")
    );
    return undefined;
  };
};
