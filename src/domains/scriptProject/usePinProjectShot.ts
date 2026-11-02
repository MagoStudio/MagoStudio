import { useTranslation } from "react-i18next";

import { usePinProjectShot as usePinProjectShotMutation } from "./data/usePinProjectShot";
import { useMutationRetryRegistry } from "./useMutationRetryRegistry";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

export const usePinProjectShot = () => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const { findRetryForRequest, withRetryRegistered } =
    useMutationRetryRegistry();

  const pinProjectShotMutation = usePinProjectShotMutation({
    onError: (error, request) =>
      reportScriptProjectFailure(
        error,
        t("script_project.pin_shot_failed.description"),
        findRetryForRequest(request)
      )
  });

  return withRetryRegistered(pinProjectShotMutation);
};
