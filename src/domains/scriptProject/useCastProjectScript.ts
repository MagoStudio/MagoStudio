import { useLatestRef } from "@hooks/useLatestRef";
import { useTranslation } from "react-i18next";

import { useCastProjectScript as useCastProjectScriptMutation } from "./data/useCastProjectScript";
import { useMutationRetryRegistry } from "./useMutationRetryRegistry";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

export const useCastProjectScript = (beforeRetry?: () => Promise<boolean>) => {
  const beforeRetryRef = useLatestRef(beforeRetry);
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const { findRetryForRequest, withRetryRegistered } =
    useMutationRetryRegistry();

  const castProjectScriptMutation = useCastProjectScriptMutation({
    onError: (error, request) =>
      reportScriptProjectFailure(
        error,
        t("script_project.cast_script_failed.description"),
        async () => {
          if (beforeRetryRef.current && !(await beforeRetryRef.current()))
            return;
          findRetryForRequest(request)?.();
        }
      )
  });

  return withRetryRegistered(castProjectScriptMutation);
};
