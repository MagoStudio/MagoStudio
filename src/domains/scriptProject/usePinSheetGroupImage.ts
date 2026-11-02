import { useTranslation } from "react-i18next";

import { usePinSheetGroupImage as usePinSheetGroupImageMutation } from "./data/usePinSheetGroupImage";
import { useMutationRetryRegistry } from "./useMutationRetryRegistry";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

export const usePinSheetGroupImage = (projectId: string | null | undefined) => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const { findRetryForRequest, withRetryRegistered } =
    useMutationRetryRegistry();

  const pinSheetGroupImageMutation = usePinSheetGroupImageMutation(projectId, {
    onError: (error, request) =>
      reportScriptProjectFailure(
        error,
        t("script_project.pin_entity_image_failed.description"),
        findRetryForRequest(request)
      )
  });

  return withRetryRegistered(pinSheetGroupImageMutation);
};
