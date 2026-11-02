import { useTranslation } from "react-i18next";

import { useGenerateProjectSheets as useGenerateProjectSheetsMutation } from "./data/useGenerateProjectSheets";
import { useMutationRetryRegistry } from "./useMutationRetryRegistry";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

export const useGenerateProjectSheets = () => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const { findRetryForRequest, withRetryRegistered } =
    useMutationRetryRegistry();

  const generateProjectSheetsMutation = useGenerateProjectSheetsMutation({
    onError: (error, request) =>
      reportScriptProjectFailure(
        error,
        t("script_project.generate_sheets_failed.description"),
        findRetryForRequest(request)
      )
  });

  return withRetryRegistered(generateProjectSheetsMutation);
};
