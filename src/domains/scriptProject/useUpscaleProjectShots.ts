import { useTranslation } from "react-i18next";

import { useUpscaleProjectShots as useUpscaleProjectShotsMutation } from "./data/useUpscaleProjectShots";
import { useMutationRetryRegistry } from "./useMutationRetryRegistry";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

export const useUpscaleProjectShots = () => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const { findRetryForRequest, withRetryRegistered } =
    useMutationRetryRegistry();

  const upscaleProjectShotsMutation = useUpscaleProjectShotsMutation({
    onError: (error, request) =>
      reportScriptProjectFailure(
        error,
        t("script_project.upscale_shots_failed.description"),
        findRetryForRequest(request)
      )
  });

  return withRetryRegistered(upscaleProjectShotsMutation);
};
