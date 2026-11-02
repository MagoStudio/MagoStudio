import { useTranslation } from "react-i18next";

import { useGenerateProjectShots as useGenerateProjectShotsMutation } from "./data/useGenerateProjectShots";
import { useMutationRetryRegistry } from "./useMutationRetryRegistry";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

export const useGenerateProjectShots = () => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const { findRetryForRequest, withRetryRegistered } =
    useMutationRetryRegistry();

  const generateProjectShotsMutation = useGenerateProjectShotsMutation({
    onError: (error, request) =>
      reportScriptProjectFailure(
        error,
        t("script_project.generate_shots_failed.description"),
        findRetryForRequest(request)
      )
  });

  return withRetryRegistered(generateProjectShotsMutation);
};
