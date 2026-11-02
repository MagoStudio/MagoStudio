import { useState } from "react";
import { useTranslation } from "react-i18next";

import { UpdateSceneStoryboardRequest } from "./api/putSceneStoryboard";
import { useSubmitSceneStoryboard } from "./data/useSubmitSceneStoryboard";
import { useUpdateSceneStoryboard } from "./data/useUpdateSceneStoryboard";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";
import { withTimelineId } from "./utils/withTimelineId";

export const useManageSceneStoryboards = (
  projectId: string,
  renderModel?: string
) => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();
  const { mutateAsync: submitSceneStoryboard } = useSubmitSceneStoryboard();
  const { mutate: updateSceneStoryboard } = useUpdateSceneStoryboard({
    onError: (error) =>
      reportScriptProjectFailure(
        error,
        t("script_project.update_storyboard_failed.description")
      )
  });
  const [submittingSceneTimelineIds, setSubmittingSceneTimelineIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [updatingSceneTimelineIds, setUpdatingSceneTimelineIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const generateSceneStoryboard = async (
    sceneTimelineId: string
  ): Promise<void> => {
    setSubmittingSceneTimelineIds(withTimelineId(sceneTimelineId, true));
    try {
      await submitSceneStoryboard({
        projectId,
        sceneTimelineId,
        ...(renderModel ? { renderModel } : {})
      });
    } catch (error) {
      reportScriptProjectFailure(
        error,
        t("script_project.generate_storyboard_failed.description"),
        () => void generateSceneStoryboard(sceneTimelineId)
      );
    } finally {
      setSubmittingSceneTimelineIds(withTimelineId(sceneTimelineId, false));
    }
  };

  const updateOneSceneStoryboard = (
    request: Omit<UpdateSceneStoryboardRequest, "projectId">
  ) => {
    setUpdatingSceneTimelineIds(withTimelineId(request.sceneTimelineId, true));
    updateSceneStoryboard(
      { projectId, ...request },
      {
        onSettled: () =>
          setUpdatingSceneTimelineIds(
            withTimelineId(request.sceneTimelineId, false)
          )
      }
    );
  };

  return {
    generateSceneStoryboard,
    isSubmittingSceneStoryboard: (sceneTimelineId: string) =>
      submittingSceneTimelineIds.has(sceneTimelineId),
    pinSceneStoryboardVersion: (
      sceneTimelineId: string,
      selectedAssetId: string | null
    ) => updateOneSceneStoryboard({ sceneTimelineId, selectedAssetId }),
    setSceneStoryboardUsedInVideoRenders: (
      sceneTimelineId: string,
      isUsedInVideoRenders: boolean
    ) => updateOneSceneStoryboard({ sceneTimelineId, isUsedInVideoRenders }),
    isUpdatingSceneStoryboard: (sceneTimelineId: string) =>
      updatingSceneTimelineIds.has(sceneTimelineId)
  };
};
