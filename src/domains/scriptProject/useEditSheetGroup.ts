import { useTranslation } from "react-i18next";

import { useEditSheetGroup as useEditSheetGroupMutation } from "./data/useEditSheetGroup";
import { useMutationRetryRegistry } from "./useMutationRetryRegistry";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

export const useEditSheetGroup = (projectId: string | null | undefined) => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const { findRetryForRequest, withRetryRegistered } =
    useMutationRetryRegistry();

  const editSheetGroupMutation = useEditSheetGroupMutation(projectId, {
    onError: (error, request) =>
      reportScriptProjectFailure(
        error,
        t("script_project.edit_entity_failed.description"),
        findRetryForRequest(request)
      )
  });

  return withRetryRegistered(editSheetGroupMutation);
};
