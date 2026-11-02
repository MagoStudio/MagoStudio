import { useTranslation } from "react-i18next";

import { useRenderSheetGroup as useRenderSheetGroupMutation } from "./data/useRenderSheetGroup";
import { useMutationRetryRegistry } from "./useMutationRetryRegistry";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";

export const useRenderSheetGroup = (projectId: string | null | undefined) => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();

  const { findRetryForRequest, withRetryRegistered } =
    useMutationRetryRegistry();

  const renderSheetGroupMutation = useRenderSheetGroupMutation(projectId, {
    onError: (error, request) =>
      reportScriptProjectFailure(
        error,
        t("script_project.render_entity_failed.description"),
        findRetryForRequest(request)
      )
  });

  return withRetryRegistered(renderSheetGroupMutation);
};
