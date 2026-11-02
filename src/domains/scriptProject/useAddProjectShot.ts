import { useTranslation } from "react-i18next";

import { useAddProjectShot as useAddProjectShotMutation } from "./data/useAddProjectShot";
import { useMutationRetryRegistry } from "./useMutationRetryRegistry";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

export const useAddProjectShot = () => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const { findRetryForRequest, withRetryRegistered } =
    useMutationRetryRegistry();

  const addProjectShotMutation = useAddProjectShotMutation({
    onError: (error, request) =>
      reportScriptProjectFailure(
        error,
        t("script_project.add_shot_failed.description"),
        findRetryForRequest(request)
      )
  });

  return withRetryRegistered(addProjectShotMutation);
};
