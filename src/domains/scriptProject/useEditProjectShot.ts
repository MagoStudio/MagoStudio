import { useTranslation } from "react-i18next";

import { useEditProjectShot as useEditProjectShotMutation } from "./data/useEditProjectShot";
import { useMutationRetryRegistry } from "./useMutationRetryRegistry";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

export const useEditProjectShot = () => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const { findRetryForRequest, withRetryRegistered } =
    useMutationRetryRegistry();

  const editProjectShotMutation = useEditProjectShotMutation({
    onError: (error, request) =>
      reportScriptProjectFailure(
        error,
        t("script_project.edit_shot_failed.description"),
        findRetryForRequest(request)
      )
  });

  return withRetryRegistered(editProjectShotMutation);
};
