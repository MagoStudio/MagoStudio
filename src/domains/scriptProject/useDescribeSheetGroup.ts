import { useTranslation } from "react-i18next";

import { useDescribeSheetGroup as useDescribeSheetGroupMutation } from "./data/useDescribeSheetGroup";
import { useMutationRetryRegistry } from "./useMutationRetryRegistry";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

export const useDescribeSheetGroup = (projectId: string | null | undefined) => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const { findRetryForRequest, withRetryRegistered } =
    useMutationRetryRegistry();

  const describeSheetGroupMutation = useDescribeSheetGroupMutation(projectId, {
    onError: (error, request) =>
      reportScriptProjectFailure(
        error,
        t("script_project.describe_entity_failed.description"),
        findRetryForRequest(request)
      )
  });

  return withRetryRegistered(describeSheetGroupMutation);
};
