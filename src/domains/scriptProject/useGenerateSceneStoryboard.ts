import { useUploadReferenceImage } from "@domains/asset/useUploadReferenceImage";
import { SheetGroup, ShotState } from "@schemas/scriptProject";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  STORYBOARD_DEFAULT_STYLE_PROMPT,
  STORYBOARD_REFERENCE_DESCRIPTION
} from "./constants";
import { useEditSheetGroup } from "./data/useEditSheetGroup";
import { usePinSheetGroupImage } from "./data/usePinSheetGroupImage";
import { useRenderShotStoryboard } from "./data/useRenderShotStoryboard";
import { renderStoryboardInputImage } from "./renderStoryboardInputImage";
import { useReportScriptProjectFailure } from "./useReportScriptProjectFailure";
import { buildStoryboardPrompt } from "./utils/buildStoryboardPrompt";
import { buildStoryboardSheetToken } from "./utils/buildStoryboardSheetToken";
import { findClosestScriptProjectAspectRatio } from "./utils/findClosestScriptProjectAspectRatio";
import { layoutStoryboardGrid } from "./utils/layoutStoryboardGrid";
import { listSceneReferenceImages } from "./utils/listSceneReferenceImages";
import { Beat } from "./utils/shotCutListTypes";

export type SceneStoryboardRequest = {
  shot: Pick<ShotState, "timeline_id" | "tags">;
  storyboardBeats: Beat[];
};

export const useGenerateSceneStoryboard = ({
  projectId,
  sheetsTimelineId,
  projectOutputSize,
  sheetGroups,
  storyboardSheetGroups,
  onStoryboardRenderAccepted
}: {
  projectId: string;
  sheetsTimelineId: string | null;
  projectOutputSize: [number, number];
  sheetGroups: SheetGroup[];
  storyboardSheetGroups: SheetGroup[];
  onStoryboardRenderAccepted: (sceneTimelineId: string) => void;
}) => {
  const { t } = useTranslation();
  const reportScriptProjectFailure = useReportScriptProjectFailure();
  const { mutateAsync: renderShotStoryboard } =
    useRenderShotStoryboard(projectId);
  const { mutateAsync: editSheetGroup } = useEditSheetGroup(projectId);
  const { mutateAsync: pinSheetGroupImage } = usePinSheetGroupImage(projectId);
  const { mutateAsync: uploadReferenceImage } = useUploadReferenceImage();
  const [submittingTimelineIds, setSubmittingTimelineIds] = useState<
    Set<string>
  >(() => new Set());

  const markStoryboardSubmitting = (
    timelineId: string,
    isSubmitting: boolean
  ) =>
    setSubmittingTimelineIds((previousTimelineIds) => {
      const nextTimelineIds = new Set(previousTimelineIds);
      if (isSubmitting) nextTimelineIds.add(timelineId);
      else nextTimelineIds.delete(timelineId);
      return nextTimelineIds;
    });

  const panelAspectRatio =
    findClosestScriptProjectAspectRatio(projectOutputSize);

  const uploadStoryboardGrid = async ({
    shot,
    storyboardBeats
  }: SceneStoryboardRequest): Promise<string> => {
    const { panelBoxes } = layoutStoryboardGrid({
      panelCount: storyboardBeats.length,
      panelAspectRatio:
        panelAspectRatio.widthUnits / panelAspectRatio.heightUnits
    });
    const storyboardGridFile = await renderStoryboardInputImage({
      panelBoxes,
      fileName: `storyboard-grid-${shot.timeline_id}.png`
    });
    const storyboardGridAssetId = await uploadReferenceImage({
      file: storyboardGridFile,
      projectId
    });
    if (!storyboardGridAssetId)
      throw new Error("Uploading the storyboard grid returned no asset");
    return storyboardGridAssetId;
  };

  const reportStoryboardFailure = (
    error: unknown,
    request: SceneStoryboardRequest
  ) =>
    reportScriptProjectFailure(
      error,
      t("script_project.generate_storyboard_failed.description"),
      () => void generateSceneStoryboard(request)
    );

  const showLatestStoryboardWithReferenceDescription = async ({
    storyboardSheetsTimelineId,
    storyboardSheetToken
  }: {
    storyboardSheetsTimelineId: string;
    storyboardSheetToken: string;
  }): Promise<void> => {
    try {
      await pinSheetGroupImage({
        timelineId: storyboardSheetsTimelineId,
        token: storyboardSheetToken,
        selectedAssetId: null
      });
      await editSheetGroup({
        timelineId: storyboardSheetsTimelineId,
        token: storyboardSheetToken,
        description: STORYBOARD_REFERENCE_DESCRIPTION
      });
    } catch (error) {
      reportScriptProjectFailure(
        error,
        t("script_project.storyboard_sheet_setup_failed.description"),
        () =>
          void showLatestStoryboardWithReferenceDescription({
            storyboardSheetsTimelineId,
            storyboardSheetToken
          })
      );
    }
  };

  const generateSceneStoryboard = async (
    request: SceneStoryboardRequest
  ): Promise<void> => {
    const { shot, storyboardBeats } = request;
    if (!sheetsTimelineId || !storyboardBeats.length) return;
    const timelineId = shot.timeline_id;
    markStoryboardSubmitting(timelineId, true);
    const storyboardSheetToken = buildStoryboardSheetToken(timelineId);

    let storyboardGridAssetId: string;
    try {
      const isStoryboardRemovedFromScene = storyboardSheetGroups.some(
        (sheetGroup) =>
          sheetGroup.token === storyboardSheetToken && !sheetGroup.enabled
      );
      if (isStoryboardRemovedFromScene)
        await editSheetGroup({
          timelineId: sheetsTimelineId,
          token: storyboardSheetToken,
          enabled: true
        });
      storyboardGridAssetId = await uploadStoryboardGrid(request);
    } catch (error) {
      markStoryboardSubmitting(timelineId, false);
      reportStoryboardFailure(error, request);
      return;
    }

    const characterReferenceImages = listSceneReferenceImages({
      tags: shot.tags,
      sheetGroups,
      tagCategories: ["characters"]
    });
    try {
      await renderShotStoryboard({
        sheetsTimelineId,
        shotTimelineId: timelineId,
        prompt: buildStoryboardPrompt({
          cutList: {
            sceneDescription: "",
            midExchangeOpening: "",
            beats: storyboardBeats
          },
          hasUserSketch: false,
          panelAspectRatio,
          stylePrompt: STORYBOARD_DEFAULT_STYLE_PROMPT,
          characterNames: characterReferenceImages.map(
            (characterReferenceImage) => characterReferenceImage.name
          )
        }),
        inputImageAssetIds: [
          storyboardGridAssetId,
          ...characterReferenceImages.map(
            (characterReferenceImage) => characterReferenceImage.assetId
          )
        ]
      });
    } catch (error) {
      markStoryboardSubmitting(timelineId, false);
      reportStoryboardFailure(error, request);
      return;
    }

    markStoryboardSubmitting(timelineId, false);
    onStoryboardRenderAccepted(timelineId);
    await showLatestStoryboardWithReferenceDescription({
      storyboardSheetsTimelineId: sheetsTimelineId,
      storyboardSheetToken
    });
  };

  return {
    generateSceneStoryboard: (request: SceneStoryboardRequest) =>
      void generateSceneStoryboard(request),
    canGenerateSceneStoryboards: sheetsTimelineId !== null,
    isSubmittingSceneStoryboard: (timelineId: string) =>
      submittingTimelineIds.has(timelineId)
  };
};
