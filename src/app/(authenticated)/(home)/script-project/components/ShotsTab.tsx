import { LaunchComfyOrSetupMagoStudioButton } from "@app/components/ComfyLaunchDialog/LaunchComfyOrSetupMagoStudioButton";
import { useIsModelGroupInstalled } from "@app/components/LocalSetupWizard/hooks/useIsModelGroupInstalled";
import { useLocalH3StepLoraInstallState } from "@app/components/LocalSetupWizard/hooks/useLocalH3StepLoraInstallState";
import { useLocalShotsReady } from "@app/components/LocalSetupWizard/hooks/useLocalRenderReady";
import { useLocalSheetModelInstallGate } from "@app/components/LocalSetupWizard/hooks/useLocalSheetModelInstallGate";
import type { RequiredLocalInstall } from "@app/components/LocalSetupWizard/requiredLocalInstall";
import { SetupMagoStudioButton } from "@app/components/LocalSetupWizard/SetupMagoStudioButton";
import { Checkbox } from "@components/Checkbox";
import { Text } from "@components/Text";
import { useProject } from "@domains/project/useProject";
import {
  DEFAULT_LOCAL_H3_LEGACY_WORKFLOW,
  DEFAULT_LOCAL_H3_MODEL,
  DEFAULT_LOCAL_H3_TEXT_ENCODER,
  SKIP_REASON_DROPPED,
  SKIP_REASON_HIDDEN,
  STORYBOARD_IMAGE_SIZE,
  STORYBOARD_RENDER_QUALITY
} from "@domains/scriptProject/constants";
import { isLocalSheetRenderModel } from "@domains/scriptProject/constants";
import { useAddProjectShot } from "@domains/scriptProject/useAddProjectShot";
import { useEditProjectShot } from "@domains/scriptProject/useEditProjectShot";
import { useGenerateProjectShots } from "@domains/scriptProject/useGenerateProjectShots";
import { useGenerateSceneStoryboard } from "@domains/scriptProject/useGenerateSceneStoryboard";
import { useImageRenderModel } from "@domains/scriptProject/useImageRenderModel";
import { useKeepStoryboardTagsNonBlocking } from "@domains/scriptProject/useKeepStoryboardTagsNonBlocking";
import { useManageSceneStoryboards } from "@domains/scriptProject/useManageSceneStoryboards";
import { usePendingShotHiddenEdits } from "@domains/scriptProject/usePendingShotHiddenEdits";
import { usePinProjectShot } from "@domains/scriptProject/usePinProjectShot";
import { useProjectCut } from "@domains/scriptProject/useProjectCut";
import { useProjectOutputSize } from "@domains/scriptProject/useProjectOutputSize";
import { useProjectShotsDryRun } from "@domains/scriptProject/useProjectShotsDryRun";
import { useRecordShotVersionBaseline } from "@domains/scriptProject/useRecordShotVersionBaseline";
import { useScriptProjectRenderAccess } from "@domains/scriptProject/useScriptProjectRenderAccess";
import { useShotRenderEngine } from "@domains/scriptProject/useShotRenderEngine";
import { buildCutShotByTimelineId } from "@domains/scriptProject/utils/buildCutShotByTimelineId";
import { buildSequentialShotRunOverride } from "@domains/scriptProject/utils/buildSequentialShotRunOverride";
import { buildSheetImageUrlIndex } from "@domains/scriptProject/utils/buildSheetImageUrlIndex";
import { buildShotFrameRange } from "@domains/scriptProject/utils/buildShotFrameRange";
import { buildShotVideoSettings } from "@domains/scriptProject/utils/buildShotVideoSettings";
import { buildStoryboardSheetToken } from "@domains/scriptProject/utils/buildStoryboardSheetToken";
import { buildVersionSettingsRestore } from "@domains/scriptProject/utils/buildVersionSettingsRestore";
import { countShotsContributingToCut } from "@domains/scriptProject/utils/countShotsContributingToCut";
import { describeSceneStoryboard } from "@domains/scriptProject/utils/describeSceneStoryboard";
import { estimateSheetImageCredits } from "@domains/scriptProject/utils/estimateSheetImageCredits";
import { estimateStaleShotsCredits } from "@domains/scriptProject/utils/estimateStaleShotsCredits";
import { filterCutToActiveScript } from "@domains/scriptProject/utils/filterCutToActiveScript";
import { filterShotsByQuery } from "@domains/scriptProject/utils/filterShotsByQuery";
import { findSequentialBlockedLabelKey } from "@domains/scriptProject/utils/findSequentialBlockedLabelKey";
import { findSequentialPredecessorShot } from "@domains/scriptProject/utils/findSequentialPredecessorShot";
import { formatShotTitle } from "@domains/scriptProject/utils/formatShotTitle";
import { getShotRunRefusalDescriptionKey } from "@domains/scriptProject/utils/getShotRunRefusalDescriptionKey";
import { isPreviousListedShotThePredecessor } from "@domains/scriptProject/utils/isPreviousListedShotThePredecessor";
import { isSheetRenderModel } from "@domains/scriptProject/utils/isSheetRenderModel";
import { isShotBlockedForNoReferenceImage } from "@domains/scriptProject/utils/isShotBlockedForNoReferenceImage";
import { isShotDurationOutOfBounds } from "@domains/scriptProject/utils/isShotDurationOutOfBounds";
import { isShotSequentialReferenceIgnored } from "@domains/scriptProject/utils/isShotSequentialReferenceIgnored";
import { listScenesAwaitingStoryboard } from "@domains/scriptProject/utils/listScenesAwaitingStoryboard";
import { normaliseSearchQuery } from "@domains/scriptProject/utils/normaliseSearchQuery";
import { partitionShotsByDropped } from "@domains/scriptProject/utils/partitionShotsByDropped";
import { partitionSkippedByRenderProgress } from "@domains/scriptProject/utils/partitionSkippedByRenderProgress";
import { STORYBOARD_TAG_CATEGORY } from "@domains/scriptProject/utils/planStoryboardSceneTagChanges";
import { SceneShotDraftEdits } from "@domains/scriptProject/utils/resolveSceneShotDraftEdits";
import { resolveShotChangedPaths } from "@domains/scriptProject/utils/resolveShotChangedPaths";
import { resolveUnsavedPromptShotRetry } from "@domains/scriptProject/utils/resolveUnsavedPromptShotRetry";
import { resolveWouldRunShotTimelineIds } from "@domains/scriptProject/utils/resolveWouldRunShotTimelineIds";
import { scrollToShotInContainer } from "@domains/scriptProject/utils/scrollToShotInContainer";
import { Beat } from "@domains/scriptProject/utils/shotCutListTypes";
import { withShotTagRemoved } from "@domains/scriptProject/utils/shotTagCategories";
import { suggestShotHeading } from "@domains/scriptProject/utils/suggestShotHeading";
import { withPendingShotHiddenEdits } from "@domains/scriptProject/utils/withPendingShotHiddenEdits";
import { GPT_IMAGE_2_QUALITY_COST } from "@home/components/Navbar/Img2ImgModalV2/schemas/gptImage2.schema";
import { useLatestRef } from "@hooks/useLatestRef";
import { useSceneTimelineVisibilitySetting } from "@hooks/userLocalStorage/useSceneTimelineVisibilitySetting";
import {
  ProjectState,
  SheetGroup,
  ShotDialogueTurn,
  ShotGenerateResult,
  ShotState
} from "@schemas/scriptProject";
import { useToast } from "@store/useToast";
import { cn } from "@utils";
import { Fragment, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { MINIMAX_H3_STEP_LORAS } from "../../../../../../desktop/shared/minimaxH3StepLoras";

import { AddShotDialog } from "./AddShotDialog";
import { EarlierScriptVersionToggle } from "./EarlierScriptVersionToggle";
import { GenerateRunButton } from "./GenerateRunButton";
import { useScenesLayout } from "./hooks/useScenesLayout";
import { LocalH3StepsDropdown } from "./LocalH3StepsDropdown";
import { ProjectOutputSizeControls } from "./ProjectOutputSizeControls";
import { ScenesLayoutSwitcher } from "./ScenesLayoutSwitcher";
import { SceneStoryboardRenderPoller } from "./SceneStoryboardRenderPoller";
import { SequenceTimeline } from "./SequenceTimeline";
import { SheetRenderModelDropdown } from "./SheetRenderModelDropdown";
import { ShotChainButton } from "./ShotChainButton";
import { ShotDragHandle } from "./ShotDragHandle";
import { ShotDropTarget } from "./ShotDropTarget";
import { ShotInsertButton } from "./ShotInsertButton";
import { ShotListRowGap } from "./ShotListRowGap";
import { ShotRenderSpeedSwitch } from "./ShotRenderSpeedSwitch";
import { ShotRow } from "./ShotRow";
import { ShotSequentialSettingsDialog } from "./ShotSequentialSettingsDialog";
import { ShotStripGap } from "./ShotStripGap";
import { resolveSceneCardPreviewMiddlePx } from "./utils/resolveSceneCardPreviewMiddlePx";
import { ScenesView } from "./utils/scenesView";

const MINIMAL_MODEL_GROUP_INSTALL: RequiredLocalInstall = {
  kind: "model-group",
  modelGroupId: "minimal"
};

type Props = {
  projectId: string;
  projectState: ProjectState;
  storyboardSheetGroups: SheetGroup[];
  scenesView: ScenesView;
  renderingShotTimelineIds: Set<string>;
  failedShotTimelineIds: Set<string>;
  isRunActive: boolean;
  canRender: boolean;
  onRunStarted: (planId: string, shotTimelineIds: string[]) => void;
};

export const ShotsTab: React.FC<Props> = ({
  projectId,
  projectState,
  storyboardSheetGroups,
  scenesView,
  renderingShotTimelineIds,
  failedShotTimelineIds,
  isRunActive,
  canRender,
  onRunStarted
}) => {
  const { t } = useTranslation();
  const { showToast, showErrorToast } = useToast();
  const [isSceneTimelineShown] = useSceneTimelineVisibilitySetting();
  const { data: project } = useProject(projectId);
  const isLocalProject = project?.origin === "local";
  const {
    outputSize,
    setOutputSize,
    shotFrames,
    shotQualityRetries,
    localH3Steps,
    setLocalH3Steps,
    isSavingOutputSize
  } = useProjectOutputSize(projectId);
  const isMinimalModelGroupInstalled = useIsModelGroupInstalled({
    modelGroupId: "minimal",
    isModelGroupCheckNeeded: isLocalProject
  });
  const localH3StepLoraInstallState =
    useLocalH3StepLoraInstallState(isLocalProject);
  const selectedStepLoraInstall: RequiredLocalInstall = {
    kind: "model-group",
    modelGroupId: MINIMAX_H3_STEP_LORAS[localH3Steps].modelGroupId
  };
  const isSelectedStepLoraModelGroupInstalled =
    localH3StepLoraInstallState.isStepLoraModelGroupInstalled(localH3Steps);
  const localReady = useLocalShotsReady(isLocalProject, localH3Steps);
  const localH3VideoSettings = isLocalProject
    ? {
        local_h3_steps: localH3Steps,
        local_h3_legacy_workflow: DEFAULT_LOCAL_H3_LEGACY_WORKFLOW,
        local_h3_text_encoder: DEFAULT_LOCAL_H3_TEXT_ENCODER,
        local_h3_model: DEFAULT_LOCAL_H3_MODEL
      }
    : {};
  const { shotEngine, isSavingShotRenderEngine, setShotRenderEngine } =
    useShotRenderEngine(projectId);
  const shotVideoSettings = {
    ...buildShotVideoSettings({
      shotEngine,
      frameRange: buildShotFrameRange(shotFrames),
      maxQualityRetries: shotQualityRetries
    }),
    ...localH3VideoSettings
  };
  const [searchQuery, setSearchQuery] = useState("");
  const shotsContentRef = useRef<HTMLDivElement>(null);
  const scrollToShot = (timelineId: string) => {
    scrollToShotInContainer(shotsContentRef.current, timelineId);
  };
  const shotsWithPendingHiddenEdits = withPendingShotHiddenEdits(
    projectState.shots,
    usePendingShotHiddenEdits(projectId)
  );
  const { shotsInActiveScript, shotsDroppedByRecast } = partitionShotsByDropped(
    shotsWithPendingHiddenEdits
  );
  const [areDroppedShotsShown, setAreDroppedShotsShown] = useState(false);
  const [isSequentialSuspendedForRun, setIsSequentialSuspendedForRun] =
    useState(false);
  const listedShots = areDroppedShotsShown
    ? [...shotsInActiveScript, ...shotsDroppedByRecast]
    : shotsInActiveScript;
  const [shotInsertBeingAdded, setShotInsertBeingAdded] = useState<{
    shotIndex: number | null;
  } | null>(null);
  const [draggedShotTimelineId, setDraggedShotTimelineId] = useState<
    string | null
  >(null);
  const draggedShot = shotsInActiveScript.find(
    (shot) => shot.timeline_id === draggedShotTimelineId
  );
  const [
    shotTimelineIdEditingSequentialSettings,
    setShotTimelineIdEditingSequentialSettings
  ] = useState<string | null>(null);
  const shotEditingSequentialSettings = shotsInActiveScript.find(
    (shot) => shot.timeline_id === shotTimelineIdEditingSequentialSettings
  );
  const predecessorOfShotEditingSequentialSettings =
    shotEditingSequentialSettings &&
    findSequentialPredecessorShot(
      shotEditingSequentialSettings,
      shotsInActiveScript
    );

  const sequentialRunOverride = buildSequentialShotRunOverride({
    shots: shotsInActiveScript,
    isSequentialSuspendedForRun
  });
  const sequentialShotCount = shotsInActiveScript.filter(
    (shot) => shot.sequential?.enabled
  ).length;

  const { data: dryRun, isFetching: isDryRunFetching } = useProjectShotsDryRun(
    projectId,
    outputSize,
    shotVideoSettings,
    sequentialRunOverride,
    canRender
  );
  const { data: cut } = useProjectCut(projectId);
  const { data: hiddenShotsDryRun } = useProjectShotsDryRun(
    projectId,
    outputSize,
    shotVideoSettings,
    sequentialRunOverride,
    canRender && shotsInActiveScript.some((shot) => shot.hidden),
    shotsInActiveScript.map((shot) => shot.timeline_id)
  );
  const staleHiddenShotTimelineIds = new Set(
    resolveWouldRunShotTimelineIds(hiddenShotsDryRun, shotsInActiveScript)
  );
  useRecordShotVersionBaseline(projectId);
  const { mutate: generateShots, isPending: isGeneratingShots } =
    useGenerateProjectShots();
  const {
    mutate: editShot,
    mutateAsync: editShotAsync,
    isPending: isEditingShot,
    variables: editingShotRequest
  } = useEditProjectShot();
  const { mutate: pinShot, isPending: isPinningShot } = usePinProjectShot();
  const { mutate: addShot, isPending: isAddingShot } = useAddProjectShot();
  const { scenesLayout, setScenesLayout } = useScenesLayout(scenesView);
  const isVideoViewSelected = scenesView === "video";
  const isStoryboardViewSelected = scenesView === "storyboard";
  const isListLayout = scenesLayout === "list";
  const sceneCardPreviewMiddlePx = resolveSceneCardPreviewMiddlePx(
    isStoryboardViewSelected
      ? [STORYBOARD_IMAGE_SIZE.width, STORYBOARD_IMAGE_SIZE.height]
      : outputSize
  );
  const latestShotsRef = useLatestRef(projectState.shots);

  const { markSceneAwaitingStoryboard } = useKeepStoryboardTagsNonBlocking({
    projectId,
    scenes: projectState.shots,
    storyboardSheetGroups
  });

  const {
    generateSceneStoryboard: generateSceneStoryboardFromSheets,
    canGenerateSceneStoryboards: canGenerateSceneStoryboardsFromSheets,
    isSubmittingSceneStoryboard: isSubmittingSceneStoryboardFromSheets
  } = useGenerateSceneStoryboard({
    projectId,
    sheetsTimelineId: projectState.sheets_timeline_id,
    projectOutputSize: outputSize,
    sheetGroups: projectState.keys,
    storyboardSheetGroups,
    onStoryboardRenderAccepted: markSceneAwaitingStoryboard
  });
  const storyboardModel = useImageRenderModel(
    projectId,
    "storyboard_render_model"
  );
  const isStoryboardRenderedLocally =
    isLocalProject && isLocalSheetRenderModel(storyboardModel.renderModel);
  const isStoryboardModelInstalled =
    !isStoryboardRenderedLocally ||
    storyboardModel.installedLocalModels.some(
      (model) => model === storyboardModel.renderModel
    );
  const storyboardModelOptions = [
    ...new Set([
      ...storyboardModel.installedLocalModels,
      ...(isLocalSheetRenderModel(storyboardModel.renderModel)
        ? [storyboardModel.renderModel]
        : [])
    ])
  ];
  const canRenderStoryboards = useScriptProjectRenderAccess(
    projectId,
    storyboardModel.renderModel
  );
  const storyboardInstall = useLocalSheetModelInstallGate({
    sheetRenderModel: storyboardModel.renderModel,
    isLocalProject
  });
  const sceneStoryboards = useManageSceneStoryboards(
    projectId,
    storyboardModel.renderModel
  );
  const isSubmittingSceneStoryboard = (sceneTimelineId: string) =>
    sceneStoryboards.isSubmittingSceneStoryboard(sceneTimelineId) ||
    isSubmittingSceneStoryboardFromSheets(sceneTimelineId);
  const canGenerateStoryboardForScene = (scene: ShotState) =>
    (!isLocalProject ||
      (canRenderStoryboards &&
        storyboardInstall.isLocalSheetModelInstalled &&
        isStoryboardModelInstalled)) &&
    (!!scene.storyboard || canGenerateSceneStoryboardsFromSheets);
  const resolveStoryboardCreditsForScene = (scene: ShotState) =>
    scene.storyboard?.credits_per_render ??
    (isLocalProject &&
    isSheetRenderModel(storyboardModel.renderModel) &&
    storyboardModel.renderModel !== "gpt_image_2_t2i"
      ? estimateSheetImageCredits(storyboardModel.renderModel, [
          STORYBOARD_IMAGE_SIZE.width,
          STORYBOARD_IMAGE_SIZE.height
        ])
      : GPT_IMAGE_2_QUALITY_COST[STORYBOARD_RENDER_QUALITY]);
  const generateStoryboardForScene = async ({
    scene,
    storyboardBeats,
    unsavedSceneShotEdits = {}
  }: {
    scene: ShotState;
    storyboardBeats: Beat[];
    unsavedSceneShotEdits?: SceneShotDraftEdits;
  }) => {
    const hasUnsavedSceneShotEdits =
      Object.keys(unsavedSceneShotEdits).length > 0;
    if (hasUnsavedSceneShotEdits) {
      try {
        await editShotAsync({
          projectId,
          timelineId: scene.timeline_id,
          ...unsavedSceneShotEdits
        });
      } catch {
        return;
      }
    }
    if (scene.storyboard) {
      await sceneStoryboards.generateSceneStoryboard(scene.timeline_id);
      return;
    }
    generateSceneStoryboardFromSheets({ shot: scene, storyboardBeats });
  };
  const changeStoryboardVideoUseForScene = (
    scene: ShotState,
    isUsedInVideoRenders: boolean
  ) => {
    if (scene.storyboard) {
      sceneStoryboards.setSceneStoryboardUsedInVideoRenders(
        scene.timeline_id,
        isUsedInVideoRenders
      );
      return;
    }
    if (!isUsedInVideoRenders) detachStoryboardFromScene(scene);
  };
  const generatingSceneStoryboardClipIds = shotsInActiveScript.flatMap(
    (scene) =>
      scene.storyboard?.status === "generating" &&
      scene.storyboard.generating_clip_id
        ? [scene.storyboard.generating_clip_id]
        : []
  );
  const scenesAwaitingStoryboard = listScenesAwaitingStoryboard({
    scenes: shotsInActiveScript,
    storyboardSheetGroups
  });
  const isNoSceneAwaitingStoryboard =
    shotsInActiveScript.length > 0 && scenesAwaitingStoryboard.length === 0;
  const scenesAwaitingStoryboardCredits = scenesAwaitingStoryboard.reduce(
    (totalCredits, { scene }) =>
      totalCredits + resolveStoryboardCreditsForScene(scene),
    0
  );
  const isAnySceneStoryboardSubmitting = shotsInActiveScript.some((scene) =>
    isSubmittingSceneStoryboard(scene.timeline_id)
  );

  const detachStoryboardFromScene = (shot: ShotState) => {
    const storyboardSheetToken = buildStoryboardSheetToken(shot.timeline_id);
    editShot({
      projectId,
      timelineId: shot.timeline_id,
      tags: withShotTagRemoved(
        shot.tags,
        STORYBOARD_TAG_CATEGORY,
        storyboardSheetToken
      )
    });
  };

  const generateShotFromSavedPrompt = async (
    shot: ShotState,
    draft: {
      videoPrompt: string;
      hasUnsavedPrompt: boolean;
      dialogue: ShotDialogueTurn[];
      hasUnsavedDialogue: boolean;
      durationSeconds?: number;
    }
  ) => {
    const hasUnsavedSceneLength = draft.durationSeconds !== undefined;
    if (
      draft.hasUnsavedPrompt ||
      draft.hasUnsavedDialogue ||
      hasUnsavedSceneLength
    ) {
      try {
        await editShotAsync({
          projectId,
          timelineId: shot.timeline_id,
          ...(draft.hasUnsavedPrompt ? { videoPrompt: draft.videoPrompt } : {}),
          ...(draft.hasUnsavedDialogue ? { dialogue: draft.dialogue } : {}),
          ...(draft.durationSeconds !== undefined
            ? { durationSeconds: draft.durationSeconds }
            : {})
        });
      } catch {
        showErrorToast({
          message: t(
            "script_project.shot_run_refused_unsaved_prompt.description"
          ),
          onRetry: () => {
            const retry = resolveUnsavedPromptShotRetry({
              failedShot: shot,
              failedDraft: draft,
              latestShot: latestShotsRef.current.find(
                (candidateShot) =>
                  candidateShot.timeline_id === shot.timeline_id
              )
            });
            void generateShotFromSavedPrompt(retry.shot, {
              ...draft,
              ...retry.draft
            });
          }
        });
        return;
      }
    }

    generateShots(
      {
        projectId,
        isDryRun: false,
        outputSize: outputSize,
        videoSettings: shotVideoSettings,
        timelineIds: [shot.timeline_id],
        sequential: sequentialRunOverride
      },
      { onSuccess: trackRunOrExplainRefusal }
    );
  };

  const imageUrlsByAssetId = buildSheetImageUrlIndex(projectState.keys);
  const tokenByAssetId = new Map(
    projectState.keys.flatMap((group) =>
      group.images.map((image) => [image.asset_id, group.token] as const)
    )
  );

  const staleShotTimelineIds = new Set(
    resolveWouldRunShotTimelineIds(dryRun, shotsInActiveScript)
  );
  const staleShotCount = staleShotTimelineIds.size;
  const isEverySceneUpToDate =
    !!dryRun && shotsInActiveScript.length > 0 && staleShotCount === 0;
  const hasOutOfBoundsStaleShot = shotsInActiveScript.some(
    (shot) =>
      staleShotTimelineIds.has(shot.timeline_id) &&
      isShotDurationOutOfBounds(shot, shotFrames, shotEngine)
  );
  const staleShotCredits = estimateStaleShotsCredits({
    staleShots: shotsInActiveScript.filter((shot) =>
      staleShotTimelineIds.has(shot.timeline_id)
    ),
    shotEngine,
    outputSize,
    projectShotFrames: shotFrames,
    attemptsPerShot: shotQualityRetries + 1
  });
  const blockedShotCount = (dryRun?.blocked ?? []).length;
  const skippedShotsInActiveScript = (dryRun?.skipped ?? []).filter(
    (entry) =>
      entry.reason !== SKIP_REASON_DROPPED &&
      entry.reason !== SKIP_REASON_HIDDEN
  );
  const { skippedAsUnchangedEntries, skippedAsRenderInProgressEntries } =
    partitionSkippedByRenderProgress(skippedShotsInActiveScript);
  const unchangedShotCount = skippedAsUnchangedEntries.length;
  const renderInProgressShotCount = skippedAsRenderInProgressEntries.length;
  const cutShotByTimelineId = buildCutShotByTimelineId(cut);
  const { cutShotsInActiveScript } = filterCutToActiveScript(
    cut,
    shotsDroppedByRecast
  );
  const shotsInCutCount = countShotsContributingToCut(cutShotsInActiveScript);

  const matchingShots = filterShotsByQuery(
    listedShots,
    projectState.keys,
    searchQuery
  );
  const isSearching = normaliseSearchQuery(searchQuery).length > 0;
  const lastListedShotInActiveScript = matchingShots.findLast(
    (shot) => !shot.dropped
  );

  const isLocalShotRenderLocked = !isMinimalModelGroupInstalled || !localReady;

  const trackRunOrExplainRefusal = (result: ShotGenerateResult) => {
    if (result.plan_id) {
      onRunStarted(
        result.plan_id,
        resolveWouldRunShotTimelineIds(result, shotsInActiveScript)
      );
      return;
    }

    const refusalDescriptionKey = getShotRunRefusalDescriptionKey(result);
    if (refusalDescriptionKey) {
      showErrorToast({ message: t(refusalDescriptionKey) });
    }
  };

  const generateShotsButton = (
    <GenerateRunButton
      label={t("script_project.generate_shots_button.label")}
      countLabel={t("script_project.generate_shots_button.count", {
        count: staleShotCount
      })}
      cost={
        !project
          ? null
          : isLocalProject
            ? { kind: "local" }
            : { kind: "credits", amount: staleShotCredits }
      }
      isDisabled={
        !canRender ||
        staleShotCount === 0 ||
        isGeneratingShots ||
        isSavingOutputSize ||
        isRunActive ||
        hasOutOfBoundsStaleShot ||
        isLocalShotRenderLocked
      }
      nothingToGenerateReason={
        isEverySceneUpToDate
          ? t("script_project.toolbar_nothing_to_generate.noChanges")
          : undefined
      }
      isPending={isGeneratingShots || isRunActive}
      isPriceLoading={
        isDryRunFetching || isSavingShotRenderEngine || isSavingOutputSize
      }
      onPress={() =>
        generateShots(
          {
            projectId,
            isDryRun: false,
            outputSize: outputSize,
            videoSettings: shotVideoSettings,
            sequential: sequentialRunOverride
          },
          { onSuccess: trackRunOrExplainRefusal }
        )
      }
      testId="script-project-generate-shots"
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {generatingSceneStoryboardClipIds.map((generatingClipId) => (
        <SceneStoryboardRenderPoller
          key={generatingClipId}
          generatingClipId={generatingClipId}
        />
      ))}
      {shotInsertBeingAdded && (
        <AddShotDialog
          suggestedHeading={suggestShotHeading(
            shotsInActiveScript,
            shotInsertBeingAdded.shotIndex
          )}
          shotIndex={shotInsertBeingAdded.shotIndex}
          sheetGroups={projectState.keys}
          imageUrlsByAssetId={imageUrlsByAssetId}
          isBusy={isAddingShot}
          onClose={() => setShotInsertBeingAdded(null)}
          onAdd={(newShot) =>
            addShot(
              { projectId, ...newShot },
              { onSuccess: () => setShotInsertBeingAdded(null) }
            )
          }
        />
      )}
      {shotEditingSequentialSettings &&
        predecessorOfShotEditingSequentialSettings && (
          <ShotSequentialSettingsDialog
            shot={shotEditingSequentialSettings}
            predecessorShot={predecessorOfShotEditingSequentialSettings}
            sequentialPromptDefaults={projectState.sequential_prompt_defaults}
            isDisabled={
              isEditingShot ||
              renderingShotTimelineIds.has(
                shotEditingSequentialSettings.timeline_id
              )
            }
            onSaveSequential={(sequential) =>
              editShot({
                projectId,
                timelineId: shotEditingSequentialSettings.timeline_id,
                sequential
              })
            }
            onClose={() => setShotTimelineIdEditingSequentialSettings(null)}
            testIdSuffix={
              shotEditingSequentialSettings.sequence_id ??
              shotEditingSequentialSettings.timeline_id
            }
          />
        )}
      <div className="flex items-center gap-3 border-b border-element-primary px-6 py-3">
        {listedShots.length > 0 && (
          <ScenesLayoutSwitcher
            scenesLayout={scenesLayout}
            onScenesLayoutChange={setScenesLayout}
          />
        )}
        {isStoryboardViewSelected && (
          <div className="flex flex-1 items-center justify-end gap-3">
            {isLocalProject &&
              (!storyboardInstall.isLocalSheetModelInstalled ||
                !isStoryboardModelInstalled) && (
                <SetupMagoStudioButton
                  requiredLocalInstall={storyboardInstall.requiredLocalInstall}
                />
              )}
            {isLocalProject && (
              <SheetRenderModelDropdown
                sheetRenderModel={storyboardModel.renderModel}
                isDisabled={storyboardModel.isSavingRenderModel || isRunActive}
                onChange={storyboardModel.setRenderModel}
                isLocalProject
                includeCloudModels={storyboardModel.canUseCloudModels}
                localModels={storyboardModelOptions}
                label={t("script_project.storyboard_render_model_input.label")}
                testId="script-project-storyboard-render-model"
              />
            )}
            <GenerateRunButton
              label={t("script_project.generate_storyboards_button.label")}
              countLabel={t(
                "script_project.generate_storyboards_button.count",
                {
                  count: scenesAwaitingStoryboard.length
                }
              )}
              cost={
                isStoryboardRenderedLocally
                  ? { kind: "local" }
                  : {
                      kind: "credits",
                      amount: scenesAwaitingStoryboardCredits
                    }
              }
              isDisabled={
                scenesAwaitingStoryboard.length === 0 ||
                !scenesAwaitingStoryboard.every(({ scene }) =>
                  canGenerateStoryboardForScene(scene)
                ) ||
                isAnySceneStoryboardSubmitting ||
                isEditingShot
              }
              nothingToGenerateReason={
                isNoSceneAwaitingStoryboard
                  ? t(
                      "script_project.toolbar_nothing_to_generate.noSceneAwaitingStoryboard"
                    )
                  : undefined
              }
              isPending={isAnySceneStoryboardSubmitting}
              onPress={() =>
                scenesAwaitingStoryboard.forEach(
                  ({ scene, storyboardBeats }) =>
                    void generateStoryboardForScene({ scene, storyboardBeats })
                )
              }
              testId="script-project-generate-storyboards"
            />
          </div>
        )}
        {isVideoViewSelected && (
          <div className="flex flex-1 items-center justify-end gap-3">
            {cutShotsInActiveScript.length > 0 && (
              <Text variant="xs" color="glyph-secondary">
                {t("script_project.cut_membership_count.label", {
                  count: shotsInCutCount,
                  total: cutShotsInActiveScript.length
                })}
              </Text>
            )}
            {blockedShotCount > 0 && (
              <Text variant="xs" color="glyph-error">
                {t("script_project.dry_run_blocked.label", {
                  count: blockedShotCount
                })}
              </Text>
            )}
            {renderInProgressShotCount > 0 && (
              <Text variant="xs" color="glyph-tertiary">
                {t("script_project.dry_run_render_in_progress.label", {
                  count: renderInProgressShotCount
                })}
              </Text>
            )}
            {unchangedShotCount > 0 && (
              <Text variant="xs" color="glyph-tertiary">
                {t("script_project.dry_run_skipped.label", {
                  count: unchangedShotCount
                })}
              </Text>
            )}
            {sequentialShotCount > 0 && (
              <Checkbox
                inputId="script-project-suspend-sequential"
                isChecked={isSequentialSuspendedForRun}
                onChange={() =>
                  setIsSequentialSuspendedForRun(!isSequentialSuspendedForRun)
                }
                label={t("script_project.suspend_sequential_for_run.label", {
                  count: sequentialShotCount
                })}
              />
            )}
            {isLocalProject && (
              <LocalH3StepsDropdown
                steps={localH3Steps}
                isDisabled={
                  isGeneratingShots || isRunActive || isSavingOutputSize
                }
                isStepLoraInstalled={
                  localH3StepLoraInstallState.isStepLoraInstalled
                }
                onChange={setLocalH3Steps}
              />
            )}
            {!isLocalProject && (
              <ShotRenderSpeedSwitch
                shotEngine={shotEngine}
                isDisabled={
                  isGeneratingShots || isRunActive || isSavingShotRenderEngine
                }
                onChange={setShotRenderEngine}
              />
            )}
            <ProjectOutputSizeControls
              outputSize={outputSize}
              isAspectRatioHidden
              isDisabled={
                isSavingOutputSize || isGeneratingShots || isRunActive
              }
              onChange={setOutputSize}
            />
            {!isMinimalModelGroupInstalled ? (
              <SetupMagoStudioButton
                requiredLocalInstall={MINIMAL_MODEL_GROUP_INSTALL}
                lockedRenderButton={generateShotsButton}
              />
            ) : !isSelectedStepLoraModelGroupInstalled ? (
              <SetupMagoStudioButton
                requiredLocalInstall={selectedStepLoraInstall}
                lockedRenderButton={generateShotsButton}
              />
            ) : !localReady ? (
              <LaunchComfyOrSetupMagoStudioButton
                requiredLocalInstall={selectedStepLoraInstall}
                lockedRenderButton={generateShotsButton}
              />
            ) : (
              generateShotsButton
            )}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-6">
        <EarlierScriptVersionToggle
          hiddenCount={shotsDroppedByRecast.length}
          areHiddenItemsShown={areDroppedShotsShown}
          onToggle={() => setAreDroppedShotsShown(!areDroppedShotsShown)}
          inputId="script-project-toggle-earlier-shots"
          testId="script-project-toggle-earlier-shots"
        />
        {matchingShots.length === 0 ? (
          <Text variant="sm" color="glyph-tertiary">
            {isSearching
              ? t("script_project.no_search_results.label", {
                  query: searchQuery.trim()
                })
              : t("script_project.empty_state.label")}
          </Text>
        ) : (
          <>
            {isSceneTimelineShown && (
              <SequenceTimeline
                projectId={projectId}
                shots={matchingShots}
                cutShots={cut?.shots ?? []}
                isLocalProject={isLocalProject}
                renderingShotTimelineIds={renderingShotTimelineIds}
                changedShotTimelineIds={staleShotTimelineIds}
                onSelect={scrollToShot}
              />
            )}
            <div
              ref={shotsContentRef}
              className={cn(
                "flex min-h-0 flex-1 px-4 pb-2 scrollbar-custom",
                isListLayout
                  ? "flex-col gap-1.5 overflow-y-auto pt-0.5"
                  : "items-start gap-1.5 overflow-x-auto"
              )}
              data-testid="script-project-shots-strip"
            >
              {matchingShots.map((shot, listedIndex) => {
                const predecessorShot = findSequentialPredecessorShot(
                  shot,
                  shotsInActiveScript
                );
                const isChainButtonShown =
                  isVideoViewSelected &&
                  !shot.dropped &&
                  isPreviousListedShotThePredecessor({
                    previousListedShot: matchingShots[listedIndex - 1],
                    predecessorShot
                  });
                const shotTestIdSuffix = shot.sequence_id ?? shot.timeline_id;
                const isLastListedShotInActiveScript =
                  shot.timeline_id ===
                  lastListedShotInActiveScript?.timeline_id;
                const isShotAcceptingDroppedShot =
                  !!draggedShot &&
                  !shot.dropped &&
                  draggedShot.timeline_id !== shot.timeline_id;

                const insertBeforeShotControls = (
                  <>
                    <ShotInsertButton
                      isDisabled={isAddingShot}
                      onPress={() =>
                        setShotInsertBeingAdded({
                          shotIndex: shot.shot_index
                        })
                      }
                      testId={`shot-insert-before-${shotTestIdSuffix}`}
                    />
                    {isChainButtonShown && (
                      <ShotChainButton
                        isChainedToPreviousShot={
                          shot.sequential?.enabled ?? false
                        }
                        onPress={() =>
                          setShotTimelineIdEditingSequentialSettings(
                            shot.timeline_id
                          )
                        }
                        testId={`shot-chain-button-${shotTestIdSuffix}`}
                      />
                    )}
                  </>
                );

                return (
                  <Fragment key={shot.timeline_id}>
                    {!shot.dropped &&
                      (isListLayout ? (
                        <ShotListRowGap
                          placement={
                            listedIndex === 0 ? "insideNextShot" : "between"
                          }
                        >
                          {insertBeforeShotControls}
                        </ShotListRowGap>
                      ) : (
                        <ShotStripGap
                          controlsMiddleTopPx={sceneCardPreviewMiddlePx}
                          placement={
                            listedIndex === 0 ? "insideNextShot" : "between"
                          }
                        >
                          {insertBeforeShotControls}
                        </ShotStripGap>
                      ))}
                    <ShotDropTarget
                      isDropAccepted={isShotAcceptingDroppedShot}
                      isDroppedShotPlacedAfter={
                        !!draggedShot &&
                        draggedShot.shot_index < shot.shot_index
                      }
                      onDropShot={(droppedShotTimelineId) => {
                        if (droppedShotTimelineId === shot.timeline_id) return;
                        editShot({
                          projectId,
                          timelineId: droppedShotTimelineId,
                          shotIndex: shot.shot_index
                        });
                      }}
                    >
                      <ShotRow
                        onSaveHeading={(heading) =>
                          editShot({
                            projectId,
                            timelineId: shot.timeline_id,
                            heading
                          })
                        }
                        projectId={projectId}
                        onReuseVersionSettings={(version) => {
                          const restored = buildVersionSettingsRestore(
                            version,
                            tokenByAssetId
                          );
                          if (!restored) {
                            showToast({
                              message: t(
                                "script_project.version_settings_missing.description"
                              )
                            });
                            return;
                          }
                          editShot({
                            projectId,
                            timelineId: shot.timeline_id,
                            ...restored
                          });
                        }}
                        shot={shot}
                        sequentialBlockedLabelKey={findSequentialBlockedLabelKey(
                          dryRun,
                          shot
                        )}
                        isSequentialReferenceIgnored={isShotSequentialReferenceIgnored(
                          dryRun,
                          shot
                        )}
                        isShotBlockedForNoReferenceImage={isShotBlockedForNoReferenceImage(
                          dryRun,
                          shot
                        )}
                        sheetGroups={projectState.keys}
                        imageUrlsByAssetId={imageUrlsByAssetId}
                        cutShot={cutShotByTimelineId.get(shot.timeline_id)}
                        isRendering={renderingShotTimelineIds.has(
                          shot.timeline_id
                        )}
                        hasFailedPlanStep={failedShotTimelineIds.has(
                          shot.timeline_id
                        )}
                        changedPaths={resolveShotChangedPaths(dryRun, shot)}
                        shotFrames={shotFrames}
                        outputSize={outputSize}
                        hasShotChangedSinceRender={(shot.hidden
                          ? staleHiddenShotTimelineIds
                          : staleShotTimelineIds
                        ).has(shot.timeline_id)}
                        estimateRerenderCost={(sceneDurationSeconds) =>
                          !project
                            ? null
                            : isLocalProject
                              ? { kind: "local" }
                              : {
                                  kind: "credits",
                                  amount: estimateStaleShotsCredits({
                                    staleShots: [
                                      {
                                        ...shot,
                                        duration_s: sceneDurationSeconds
                                      }
                                    ],
                                    shotEngine,
                                    outputSize,
                                    projectShotFrames: shotFrames,
                                    attemptsPerShot: shotQualityRetries + 1
                                  })
                                }
                        }
                        isBusy={isEditingShot || isPinningShot}
                        isLockPending={
                          isEditingShot &&
                          editingShotRequest?.isShotLocked !== undefined &&
                          editingShotRequest.timelineId === shot.timeline_id
                        }
                        isRenderDisabled={!canRender}
                        onPinVersion={(assetId) =>
                          pinShot({
                            projectId,
                            timelineId: shot.timeline_id,
                            selectedAssetId: assetId
                          })
                        }
                        onSaveSceneShots={(sceneShotEdits) =>
                          editShot({
                            projectId,
                            timelineId: shot.timeline_id,
                            ...sceneShotEdits
                          })
                        }
                        storyboard={describeSceneStoryboard(
                          shot,
                          storyboardSheetGroups
                        )}
                        scenesView={scenesView}
                        scenesLayout={scenesLayout}
                        storyboardCost={
                          isStoryboardRenderedLocally
                            ? { kind: "local" }
                            : {
                                kind: "credits",
                                amount: resolveStoryboardCreditsForScene(shot)
                              }
                        }
                        isStoryboardSubmitting={isSubmittingSceneStoryboard(
                          shot.timeline_id
                        )}
                        canGenerateStoryboard={canGenerateStoryboardForScene(
                          shot
                        )}
                        onGenerateStoryboard={(storyboardRequest) =>
                          void generateStoryboardForScene({
                            scene: shot,
                            ...storyboardRequest
                          })
                        }
                        onChangeStoryboardVideoUse={(isUsedInVideoRenders) =>
                          changeStoryboardVideoUseForScene(
                            shot,
                            isUsedInVideoRenders
                          )
                        }
                        onPinStoryboardVersion={(selectedAssetId) =>
                          sceneStoryboards.pinSceneStoryboardVersion(
                            shot.timeline_id,
                            selectedAssetId
                          )
                        }
                        isUpdatingStoryboard={sceneStoryboards.isUpdatingSceneStoryboard(
                          shot.timeline_id
                        )}
                        onRetryRender={(draft) =>
                          void generateShotFromSavedPrompt(shot, draft)
                        }
                        onSaveTags={(tags) =>
                          editShot({
                            projectId,
                            timelineId: shot.timeline_id,
                            tags
                          })
                        }
                        onToggleHidden={() =>
                          editShot({
                            projectId,
                            timelineId: shot.timeline_id,
                            isShotHidden: !shot.hidden
                          })
                        }
                        onToggleLocked={() =>
                          editShot({
                            projectId,
                            timelineId: shot.timeline_id,
                            isShotLocked: !shot.locked
                          })
                        }
                        dragHandle={
                          !shot.dropped && (
                            <ShotDragHandle
                              shotTimelineId={shot.timeline_id}
                              shotLabel={formatShotTitle({
                                heading: shot.heading,
                                shotIndex: shot.shot_index
                              })}
                              isDisabled={isEditingShot}
                              onDragStart={() =>
                                setDraggedShotTimelineId(shot.timeline_id)
                              }
                              onDragEnd={() => setDraggedShotTimelineId(null)}
                              testId={`shot-drag-handle-${shotTestIdSuffix}`}
                            />
                          )
                        }
                      />
                    </ShotDropTarget>
                    {isLastListedShotInActiveScript &&
                      (isListLayout ? (
                        <ShotListRowGap placement="insidePreviousShot">
                          <ShotInsertButton
                            isDisabled={isAddingShot}
                            onPress={() =>
                              setShotInsertBeingAdded({ shotIndex: null })
                            }
                            testId="shot-insert-end"
                          />
                        </ShotListRowGap>
                      ) : (
                        <ShotStripGap
                          controlsMiddleTopPx={sceneCardPreviewMiddlePx}
                          placement="insidePreviousShot"
                        >
                          <ShotInsertButton
                            isDisabled={isAddingShot}
                            onPress={() =>
                              setShotInsertBeingAdded({ shotIndex: null })
                            }
                            testId="shot-insert-end"
                          />
                        </ShotStripGap>
                      ))}
                  </Fragment>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
