import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { InlineEditableText } from "@components/InlineEditableText";
import { MainButton } from "@components/MainButton";
import { Switch } from "@components/Switch";
import { Text } from "@components/Text";
import {
  getShotDurationBounds,
  SHOT_HEADING_MAX_LENGTH
} from "@domains/scriptProject/constants";
import { useCutShotVersionsInDisplayOrder } from "@domains/scriptProject/useCutShotVersionsInDisplayOrder";
import { useSceneShotLayoutDraft } from "@domains/scriptProject/useSceneShotLayoutDraft";
import { useShotRenderEngine } from "@domains/scriptProject/useShotRenderEngine";
import { SheetImageUrls } from "@domains/scriptProject/utils/buildSheetImageUrlIndex";
import { buildShotReferenceChips } from "@domains/scriptProject/utils/buildShotReferenceChips";
import { buildStoryboardBeatsFromSceneShots } from "@domains/scriptProject/utils/buildStoryboardBeatsFromSceneShots";
import {
  collapseReferenceChanges,
  describeChangedFields
} from "@domains/scriptProject/utils/describeChangedFields";
import { formatSceneShotSeconds } from "@domains/scriptProject/utils/formatSceneShotSeconds";
import { formatShotTitle } from "@domains/scriptProject/utils/formatShotTitle";
import { getShotBlockedClauseLabelKey } from "@domains/scriptProject/utils/getShotBlockedClauseLabelKey";
import { hasShotFailedInPlan } from "@domains/scriptProject/utils/hasShotFailedInPlan";
import { isCutShotVersionRendering } from "@domains/scriptProject/utils/isCutShotVersionRendering";
import { DRAFT_SAVING_ACTION_ATTRIBUTE } from "@domains/scriptProject/utils/isFocusMovingToDraftSavingAction";
import { isShotDurationOutOfBounds } from "@domains/scriptProject/utils/isShotDurationOutOfBounds";
import { isStoryboardSheetGroup } from "@domains/scriptProject/utils/isStoryboardSheetGroup";
import { ProjectOutputSize } from "@domains/scriptProject/utils/projectOutputSize";
import {
  SceneShotDraftEdits,
  resolveSceneShotDraftEdits
} from "@domains/scriptProject/utils/resolveSceneShotDraftEdits";
import { SceneStoryboardView } from "@domains/scriptProject/utils/sceneStoryboardView";
import { Beat } from "@domains/scriptProject/utils/shotCutListTypes";
import {
  getTagCategoryForSheetKind,
  withShotTagAdded,
  withShotTagRemoved
} from "@domains/scriptProject/utils/shotTagCategories";
import { framesToSeconds } from "@domains/scriptProject/utils/snapShotFrames";
import { hasShotRenderFailed } from "@domains/scriptProject/utils/summariseShotRenderState";
import {
  CutShot,
  CutShotVersion,
  ShotDialogueTurn,
  SheetGroup,
  ShotState,
  ShotTags
} from "@schemas/scriptProject";
import { cn } from "@utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ChangedFieldsNote } from "./ChangedFieldsNote";
import { CutShotShowAllVersionsLink } from "./CutShotShowAllVersionsLink";
import { CutShotVersionDialog } from "./CutShotVersionDialog";
import { CutShotVersionPreview } from "./CutShotVersionPreview";
import { RenderCostLabel, ScriptProjectRenderCost } from "./RenderCostLabel";
import { SceneNoticeCard } from "./SceneNoticeCard";
import { SceneShotTable } from "./SceneShotTable";
import { SceneStoryboardVersionsDialog } from "./SceneStoryboardVersionsDialog";
import { ShotAddReferenceControl } from "./ShotAddReferenceControl";
import { ShotLockButton } from "./ShotLockButton";
import { ShotReferenceList } from "./ShotReferenceList";
import { ShotStoryboardReferenceTile } from "./ShotStoryboardReferenceTile";
import { ShotStoryboardVersionCard } from "./ShotStoryboardVersionCard";
import { ShotVersionStrip } from "./ShotVersionStrip";
import { ShotVideoPreview } from "./ShotVideoPreview";
import { ScenesLayout } from "./utils/scenesLayout";
import { ScenesView } from "./utils/scenesView";

const VISIBLE_LANDSCAPE_VERSION_COUNT = 4;
const VISIBLE_PORTRAIT_VERSION_COUNT = 3;

type Props = {
  projectId: string;
  onSaveHeading: (heading: string) => void;
  onReuseVersionSettings: (version: CutShotVersion) => void;
  shot: ShotState;
  sequentialBlockedLabelKey: string | null;
  isSequentialReferenceIgnored: boolean;
  isShotBlockedForNoReferenceImage: boolean;
  sheetGroups: SheetGroup[];
  cutShot: CutShot | undefined;
  imageUrlsByAssetId: Map<string, SheetImageUrls>;
  isRendering: boolean;
  hasFailedPlanStep: boolean;
  shotFrames: number;
  outputSize: ProjectOutputSize;
  estimateRerenderCost: (
    sceneDurationSeconds: number | null | undefined
  ) => ScriptProjectRenderCost;
  hasShotChangedSinceRender: boolean;
  changedPaths: string[] | undefined;
  onSaveSceneShots: (sceneShotEdits: SceneShotDraftEdits) => void;
  onSaveTags: (tags: ShotTags) => void;
  onRetryRender: (draft: {
    videoPrompt: string;
    hasUnsavedPrompt: boolean;
    dialogue: ShotDialogueTurn[];
    hasUnsavedDialogue: boolean;
    durationSeconds?: number;
  }) => void;
  onPinVersion: (assetId: string | null) => void;
  storyboard: SceneStoryboardView;
  scenesView: ScenesView;
  scenesLayout: ScenesLayout;
  storyboardCost: ScriptProjectRenderCost;
  isStoryboardSubmitting: boolean;
  canGenerateStoryboard: boolean;
  onGenerateStoryboard: (storyboardRequest: {
    storyboardBeats: Beat[];
    unsavedSceneShotEdits: SceneShotDraftEdits;
  }) => void;
  onChangeStoryboardVideoUse: (isUsedInVideoRenders: boolean) => void;
  onPinStoryboardVersion: (selectedAssetId: string | null) => void;
  isUpdatingStoryboard: boolean;
  onToggleHidden: () => void;
  onToggleLocked: () => void;
  dragHandle: React.ReactNode;
  isBusy: boolean;
  isLockPending: boolean;
  isRenderDisabled: boolean;
};

export const ShotRow: React.FC<Props> = ({
  projectId,
  onSaveHeading,
  onReuseVersionSettings,
  shot,
  sequentialBlockedLabelKey,
  isSequentialReferenceIgnored,
  isShotBlockedForNoReferenceImage,
  sheetGroups,
  cutShot,
  imageUrlsByAssetId,
  isRendering,
  hasFailedPlanStep,
  shotFrames,
  outputSize,
  estimateRerenderCost,
  hasShotChangedSinceRender,
  changedPaths,
  onSaveSceneShots,
  onSaveTags,
  onRetryRender,
  onPinVersion,
  storyboard,
  scenesView,
  scenesLayout,
  storyboardCost,
  isStoryboardSubmitting,
  canGenerateStoryboard,
  onGenerateStoryboard,
  onChangeStoryboardVideoUse,
  onPinStoryboardVersion,
  isUpdatingStoryboard,
  onToggleHidden,
  onToggleLocked,
  dragHandle,
  isBusy,
  isLockPending,
  isRenderDisabled
}) => {
  const { t } = useTranslation();
  const [outputWidthPx, outputHeightPx] = outputSize;
  const isLandscapeOutput = outputWidthPx > outputHeightPx;
  const shotTestIdSuffix = shot.sequence_id ?? shot.timeline_id;
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [isStoryboardVersionDialogOpen, setIsStoryboardVersionDialogOpen] =
    useState(false);
  const { shotEngine } = useShotRenderEngine(projectId);
  const durationBounds = getShotDurationBounds(shotEngine);
  const { sceneShotLayout, setSceneShotLayout } = useSceneShotLayoutDraft(shot);
  const { unsavedEdits: unsavedSceneShotEdits, sceneDurationSeconds } =
    resolveSceneShotDraftEdits({ shot, sceneShotLayout });
  const hasUnsavedSceneShotEdits =
    Object.keys(unsavedSceneShotEdits).length > 0;
  const chips = buildShotReferenceChips(shot, sheetGroups);
  const referenceChipsWithoutStoryboard = chips.filter(
    (chip) => !isStoryboardSheetGroup(chip)
  );
  const blockingEntityClauses = shot.missing_references.map((missing) =>
    t(getShotBlockedClauseLabelKey(missing.reason), {
      name:
        chips.find((chip) => chip.token === missing.token)?.name ??
        missing.token
    })
  );
  const hasFailedRender =
    hasShotRenderFailed(cutShot) ||
    hasShotFailedInPlan({ cutShot, hasFailedPlanStep });
  const canShotGenerateNewVersion =
    hasShotChangedSinceRender || hasUnsavedSceneShotEdits || hasFailedRender;
  const isDurationOutOfBounds = isShotDurationOutOfBounds(
    { ...shot, duration_s: sceneDurationSeconds },
    shotFrames,
    shotEngine
  );
  const versionsInDisplayOrder = useCutShotVersionsInDisplayOrder(
    projectId,
    cutShot
  );
  const { shownVersion, versionsBelowShownVersion } = versionsInDisplayOrder;
  const isShotLocked = shot.locked === true;
  const isSceneEditingDisabled = isBusy || isShotLocked;
  const isGenerateNewVersionDisabled =
    isRenderDisabled ||
    isSceneEditingDisabled ||
    isRendering ||
    isDurationOutOfBounds ||
    isShotBlockedForNoReferenceImage ||
    !canShotGenerateNewVersion;
  const hasShotBeenRendered = !!cutShot && cutShot.versions.length > 0;
  const isGenerateDisabledForNoChangesSinceLastVersion =
    hasShotBeenRendered &&
    !canShotGenerateNewVersion &&
    !isRendering &&
    !isShotLocked;
  const isHeadingReadOnly = isSceneEditingDisabled && !isEditingHeading;
  const effectiveShotDurationSeconds =
    typeof sceneDurationSeconds === "number" && sceneDurationSeconds > 0
      ? sceneDurationSeconds
      : framesToSeconds(shotFrames);
  const rerenderCost = estimateRerenderCost(sceneDurationSeconds);
  const storyboardBeats = buildStoryboardBeatsFromSceneShots(
    sceneShotLayout.shots
  );
  const hasTooManyShotsToDraw =
    storyboard.maxShotCountToDraw !== undefined &&
    storyboardBeats.length > storyboard.maxShotCountToDraw;
  const isStoryboardBeingMade =
    isStoryboardSubmitting || storyboard.isRendering;
  const isGenerateStoryboardDisabled =
    isSceneEditingDisabled ||
    !canGenerateStoryboard ||
    isStoryboardBeingMade ||
    !storyboardBeats.length ||
    hasTooManyShotsToDraw;
  const isStoryboardViewSelected = scenesView === "storyboard";
  const isVideoRenderingWithoutFailedStoryboard =
    storyboard.hasNoUsableVersion && !isStoryboardBeingMade;
  const isVideoRenderingWithoutStaleStoryboard =
    storyboard.isStale && storyboard.isUsedInVideoRenders;
  const isStoryboardSentToVideo =
    !!storyboard.imageUrl &&
    storyboard.isUsedInVideoRenders &&
    !storyboard.isStale;
  const hasStoryboardVersions = storyboard.versionCount > 0;
  const canOpenStoryboardVersions =
    storyboard.canListVersions && storyboard.versionCount > 1;
  const canSwitchStoryboardVideoUse =
    storyboard.canSwitchVideoUseBackOn && hasStoryboardVersions;
  const isVideoViewSelected = scenesView === "video";
  const isListLayout = scenesLayout === "list";
  const isRenderingVersionMissingFromVersions =
    isRendering &&
    hasShotBeenRendered &&
    !(cutShot?.versions ?? []).some(isCutShotVersionRendering);
  const visibleVersionCount =
    (isLandscapeOutput
      ? VISIBLE_LANDSCAPE_VERSION_COUNT
      : VISIBLE_PORTRAIT_VERSION_COUNT) -
    (isRenderingVersionMissingFromVersions ? 1 : 0);
  const hasMoreVersionsThanShown =
    versionsBelowShownVersion.length > visibleVersionCount;
  const isVersionColumnShown =
    hasShotBeenRendered &&
    !isShotLocked &&
    (versionsBelowShownVersion.length > 0 ||
      isRenderingVersionMissingFromVersions);
  const hasChangedFieldsToReport =
    describeChangedFields(collapseReferenceChanges(changedPaths)).length > 0;

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-1.5",
        isListLayout ? "w-full min-w-0" : "w-[432px]"
      )}
    >
      <div
        data-testid={`shot-row-${shotTestIdSuffix}`}
        data-shot-timeline-id={shot.timeline_id}
        className={cn(
          "flex w-full flex-col gap-4 overflow-y-auto rounded-lg border-2 border-element-primary bg-surface-secondary p-3",
          shot.hidden && "opacity-60"
        )}
      >
        <div className="flex h-6 items-center gap-1.5">
          {dragHandle}
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center",
              isShotLocked && "opacity-50"
            )}
          >
            {isHeadingReadOnly ? (
              <Text variant="md" weight="semibold" className="truncate">
                {shot.heading}
              </Text>
            ) : (
              <InlineEditableText
                value={shot.heading ?? ""}
                onSave={onSaveHeading}
                onEditingChange={setIsEditingHeading}
                maxLength={SHOT_HEADING_MAX_LENGTH}
                trigger="doubleClick"
                className="min-w-0"
              >
                <Text variant="md" weight="semibold" className="truncate">
                  {shot.heading ||
                    t("script_project.add_shot_name_input.placeholder")}
                </Text>
              </InlineEditableText>
            )}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {((!!shownVersion && isVideoViewSelected) || isShotLocked) && (
              <ShotLockButton
                isShotLocked={isShotLocked}
                isLockPending={isLockPending}
                onToggleLocked={onToggleLocked}
                testId={`shot-lock-${shotTestIdSuffix}`}
              />
            )}
            {!shot.dropped && (
              <IconActionButton
                variant="dark"
                size="xs"
                icon={<Icon iconSet="16" iconName="visibility" />}
                aria-label={t(
                  shot.hidden
                    ? "script_project.show_shot_button.ariaLabel"
                    : "script_project.hide_shot_button.ariaLabel"
                )}
                aria-pressed={shot.hidden}
                isDisabled={isSceneEditingDisabled || isRendering}
                onPress={onToggleHidden}
                data-testid={`shot-hide-${shotTestIdSuffix}`}
              />
            )}
          </div>
        </div>

        <div
          className={
            isListLayout
              ? "grid grid-cols-[404px_minmax(0,1fr)] items-start gap-6"
              : "flex flex-col gap-4"
          }
        >
          <div className="flex min-w-0 flex-col gap-4">
            {isStoryboardViewSelected && (
              <ShotStoryboardVersionCard
                storyboardImageUrl={storyboard.imageUrl}
                isStoryboardRendering={isStoryboardBeingMade}
                failedStoryboardClipId={storyboard.failedRenderClipId}
                hasStoryboardFailed={storyboard.hasNoUsableVersion}
                testId={`shot-storyboard-version-${shotTestIdSuffix}`}
              />
            )}
            {isStoryboardViewSelected &&
              (canOpenStoryboardVersions || canSwitchStoryboardVideoUse) && (
                <div className="flex items-center justify-between gap-3">
                  {canOpenStoryboardVersions && (
                    <GhostButton
                      size="sm"
                      colorScheme="default"
                      isDisabled={isSceneEditingDisabled}
                      onPress={() => setIsStoryboardVersionDialogOpen(true)}
                      data-testid={`shot-storyboard-versions-${shotTestIdSuffix}`}
                    >
                      {t("script_project.storyboard_versions_link.label", {
                        count: storyboard.versionCount
                      })}
                    </GhostButton>
                  )}
                  {canSwitchStoryboardVideoUse && (
                    <Switch
                      className="ml-auto"
                      label={t(
                        "script_project.storyboard_used_in_video_switch.label"
                      )}
                      isSelected={storyboard.isUsedInVideoRenders}
                      isDisabled={
                        isSceneEditingDisabled || isUpdatingStoryboard
                      }
                      onChange={onChangeStoryboardVideoUse}
                    />
                  )}
                </div>
              )}

            {isVideoViewSelected && (
              <div className="flex flex-col gap-2">
                <div className="w-full shrink-0">
                  {cutShot && hasShotBeenRendered ? (
                    <CutShotVersionPreview
                      projectId={projectId}
                      shot={cutShot}
                      outputSize={outputSize}
                      versionsInDisplayOrder={versionsInDisplayOrder}
                      onOpenVersions={
                        isShotLocked
                          ? undefined
                          : () => setIsVersionDialogOpen(true)
                      }
                    />
                  ) : (
                    <ShotVideoPreview
                      videoUrl={null}
                      hasRender={false}
                      isRendering={isRendering}
                      outputSize={outputSize}
                      testId={`shot-video-${shotTestIdSuffix}`}
                    />
                  )}
                </div>
                {cutShot && isVersionColumnShown && (
                  <div className="flex w-full flex-col gap-2">
                    <div
                      className={cn(
                        "grid w-full gap-2",
                        isLandscapeOutput ? "grid-cols-2" : "grid-cols-3"
                      )}
                    >
                      {isRenderingVersionMissingFromVersions && (
                        <div className="flex w-full min-w-0 shrink-0 flex-col gap-1">
                          <Text variant="2xs" color="glyph-tertiary">
                            {t("script_project.version_not_ready.label")}
                          </Text>
                          <ShotVideoPreview
                            videoUrl={null}
                            hasRender={false}
                            isRendering
                            outputSize={outputSize}
                            testId={`shot-rendering-version-${shotTestIdSuffix}`}
                          />
                        </div>
                      )}
                      <ShotVersionStrip
                        projectId={projectId}
                        shot={cutShot}
                        outputSize={outputSize}
                        versionsInDisplayOrder={versionsInDisplayOrder}
                        isBusy={isBusy}
                        onPin={onPinVersion}
                        onReuseSettings={onReuseVersionSettings}
                        visibleVersionCount={visibleVersionCount}
                        onOpenVersions={() => setIsVersionDialogOpen(true)}
                      />
                    </div>
                    {hasMoreVersionsThanShown && (
                      <CutShotShowAllVersionsLink
                        projectId={projectId}
                        shot={cutShot}
                        outputSize={outputSize}
                        versionsInDisplayOrder={versionsInDisplayOrder}
                        isBusy={isBusy}
                        onPin={onPinVersion}
                        onReuseSettings={onReuseVersionSettings}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={cn(
              "flex min-w-0 flex-col gap-4",
              isShotLocked && "opacity-50"
            )}
            data-testid={`shot-card-details-${shotTestIdSuffix}`}
          >
            {isVideoViewSelected && isSequentialReferenceIgnored && (
              <Text
                variant="xs"
                color="glyph-tertiary"
                data-testid={`shot-sequential-ignored-${shotTestIdSuffix}`}
              >
                {t("script_project.shot_sequential_reference_ignored.label")}
              </Text>
            )}

            <SceneShotTable
              shots={sceneShotLayout.shots}
              newShotDurationSeconds={durationBounds.minSeconds}
              onShotsChange={(shots) =>
                setSceneShotLayout((layout) => ({ ...layout, shots }))
              }
              onSaveShots={(shots) => {
                const { unsavedEdits } = resolveSceneShotDraftEdits({
                  shot,
                  sceneShotLayout: { ...sceneShotLayout, shots }
                });
                if (Object.keys(unsavedEdits).length)
                  onSaveSceneShots(unsavedEdits);
              }}
              isDisabled={isShotLocked}
              testId={`scene-shot-table-${shotTestIdSuffix}`}
            />

            {isVideoViewSelected && (
              <div className="flex flex-col gap-2">
                <Text variant="sm" weight="medium" color="glyph-primary">
                  {t("script_project.scene_references_heading.label")}
                </Text>
                <div className="grid grid-cols-[repeat(auto-fill,65px)] gap-1.5">
                  {isStoryboardSentToVideo && storyboard.imageUrl && (
                    <ShotStoryboardReferenceTile
                      storyboardImageUrl={storyboard.imageUrl}
                      isBusy={isSceneEditingDisabled || isUpdatingStoryboard}
                      onRemove={() => onChangeStoryboardVideoUse(false)}
                      testId={`shot-storyboard-reference-${shotTestIdSuffix}`}
                    />
                  )}
                  <ShotReferenceList
                    chips={referenceChipsWithoutStoryboard}
                    imageUrlsByAssetId={imageUrlsByAssetId}
                    isBusy={isSceneEditingDisabled}
                    onRemoveReference={(chip) =>
                      onSaveTags(
                        withShotTagRemoved(shot.tags, chip.category, chip.token)
                      )
                    }
                  />
                  <ShotAddReferenceControl
                    sheetGroups={sheetGroups}
                    taggedTokens={chips.map((chip) => chip.token)}
                    isBusy={isSceneEditingDisabled}
                    onAddReference={(group) => {
                      const category = getTagCategoryForSheetKind(group.kind);
                      if (!category) return;
                      onSaveTags(
                        withShotTagAdded(shot.tags, category, group.token)
                      );
                    }}
                  />
                </div>
              </div>
            )}

            <div
              className={cn(
                "flex flex-col gap-1.5",
                isListLayout ? "max-w-[320px]" : "w-full"
              )}
            >
              {isStoryboardViewSelected && (
                <MainButton
                  size="md"
                  colorScheme="primary"
                  fullWidth
                  isDisabled={isGenerateStoryboardDisabled}
                  onPress={() =>
                    onGenerateStoryboard({
                      storyboardBeats,
                      unsavedSceneShotEdits
                    })
                  }
                  {...{ [DRAFT_SAVING_ACTION_ATTRIBUTE]: "true" }}
                  data-testid={`shot-generate-storyboard-${shotTestIdSuffix}`}
                >
                  <span className="flex items-center gap-1.5">
                    {t("script_project.generate_storyboard_button.label")}
                    <RenderCostLabel
                      cost={storyboardCost}
                      isDisabled={isGenerateStoryboardDisabled}
                    />
                  </span>
                </MainButton>
              )}

              {isVideoViewSelected && (
                <>
                  <MainButton
                    size="md"
                    colorScheme="primary"
                    fullWidth
                    isDisabled={isGenerateNewVersionDisabled}
                    onPress={() =>
                      onRetryRender({
                        videoPrompt:
                          unsavedSceneShotEdits.videoPrompt ??
                          shot.video_prompt ??
                          "",
                        hasUnsavedPrompt:
                          unsavedSceneShotEdits.videoPrompt !== undefined,
                        dialogue:
                          unsavedSceneShotEdits.dialogue ?? shot.dialogue ?? [],
                        hasUnsavedDialogue:
                          unsavedSceneShotEdits.dialogue !== undefined,
                        durationSeconds: unsavedSceneShotEdits.durationSeconds
                      })
                    }
                    {...{ [DRAFT_SAVING_ACTION_ATTRIBUTE]: "true" }}
                    data-testid={`shot-rerender-${shotTestIdSuffix}`}
                  >
                    <span className="flex items-center gap-1.5">
                      {t("script_project.generate_scene_button.label", {
                        seconds: formatSceneShotSeconds(
                          effectiveShotDurationSeconds
                        )
                      })}
                      <RenderCostLabel
                        cost={rerenderCost}
                        isDisabled={isGenerateNewVersionDisabled}
                      />
                    </span>
                  </MainButton>
                  {isGenerateDisabledForNoChangesSinceLastVersion && (
                    <Text
                      variant="xs"
                      color="glyph-secondary"
                      className="text-center"
                      data-testid={`shot-generate-no-changes-${shotTestIdSuffix}`}
                    >
                      {t("script_project.generate_scene_no_changes_note.label")}
                    </Text>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isStoryboardVersionDialogOpen && (
        <SceneStoryboardVersionsDialog
          projectId={projectId}
          sceneTimelineId={shot.timeline_id}
          sceneTitle={formatShotTitle({
            heading: shot.heading,
            shotIndex: shot.shot_index
          })}
          isOpen
          isBusy={isSceneEditingDisabled || isUpdatingStoryboard}
          onOpenChange={setIsStoryboardVersionDialogOpen}
          onPin={onPinStoryboardVersion}
        />
      )}
      {cutShot && shownVersion && isVersionDialogOpen && (
        <CutShotVersionDialog
          projectId={projectId}
          shot={cutShot}
          outputSize={outputSize}
          versionsInDisplayOrder={versionsInDisplayOrder}
          shownVersionAssetId={shownVersion.asset_id}
          isOpen
          isBusy={isBusy}
          onOpenChange={setIsVersionDialogOpen}
          onPin={onPinVersion}
          onReuseSettings={onReuseVersionSettings}
        />
      )}
      {!isShotLocked && (
        <>
          {isVideoViewSelected && hasChangedFieldsToReport && (
            <SceneNoticeCard severity="warning">
              <ChangedFieldsNote
                changedPaths={changedPaths}
                testId={`shot-changed-${shotTestIdSuffix}`}
              />
            </SceneNoticeCard>
          )}
          {isDurationOutOfBounds && (
            <SceneNoticeCard severity="error">
              <Text
                variant="xs"
                color="glyph-error"
                data-testid={`shot-duration-out-of-bounds-${shotTestIdSuffix}`}
              >
                {t("script_project.shot_duration_out_of_bounds.label", {
                  minSeconds: durationBounds.minSeconds,
                  maxSeconds: durationBounds.maxSeconds,
                  seconds: effectiveShotDurationSeconds
                })}
              </Text>
            </SceneNoticeCard>
          )}
          {isStoryboardViewSelected &&
            storyboard.hasNoUsableVersion &&
            !isStoryboardBeingMade && (
              <SceneNoticeCard severity="error">
                <Text
                  variant="xs"
                  color="glyph-error"
                  data-testid={`shot-storyboard-failed-${shotTestIdSuffix}`}
                >
                  {t("script_project.shot_storyboard_failed.label")}
                </Text>
              </SceneNoticeCard>
            )}
          {isStoryboardViewSelected &&
            storyboard.hasLastAttemptFailed &&
            !isStoryboardBeingMade && (
              <SceneNoticeCard severity="warning">
                <Text
                  variant="xs"
                  color="glyph-warning"
                  data-testid={`shot-storyboard-last-attempt-failed-${shotTestIdSuffix}`}
                >
                  {t("script_project.storyboard_last_attempt_failed.label")}
                </Text>
              </SceneNoticeCard>
            )}
          {isStoryboardViewSelected &&
            storyboard.isStale &&
            !isStoryboardBeingMade && (
              <SceneNoticeCard severity="warning">
                <Text
                  variant="xs"
                  color="glyph-warning"
                  data-testid={`shot-storyboard-stale-${shotTestIdSuffix}`}
                >
                  {t("script_project.storyboard_stale.label")}
                </Text>
              </SceneNoticeCard>
            )}
          {isStoryboardViewSelected && hasTooManyShotsToDraw && (
            <SceneNoticeCard severity="warning">
              <Text
                variant="xs"
                color="glyph-warning"
                data-testid={`shot-storyboard-too-many-shots-${shotTestIdSuffix}`}
              >
                {t("script_project.storyboard_too_many_shots.label", {
                  count: storyboard.maxShotCountToDraw
                })}
              </Text>
            </SceneNoticeCard>
          )}
          {isVideoViewSelected && isVideoRenderingWithoutFailedStoryboard && (
            <SceneNoticeCard severity="warning">
              <Text
                variant="xs"
                color="glyph-warning"
                data-testid={`shot-video-without-storyboard-${shotTestIdSuffix}`}
              >
                {t("script_project.video_without_failed_storyboard.label")}
              </Text>
            </SceneNoticeCard>
          )}
          {isVideoViewSelected && isVideoRenderingWithoutStaleStoryboard && (
            <SceneNoticeCard severity="warning">
              <Text
                variant="xs"
                color="glyph-warning"
                data-testid={`shot-video-without-stale-storyboard-${shotTestIdSuffix}`}
              >
                {t("script_project.video_without_stale_storyboard.label")}
              </Text>
            </SceneNoticeCard>
          )}
          {isVideoViewSelected && hasFailedRender && (
            <SceneNoticeCard severity="error">
              <Text
                variant="xs"
                color="glyph-error"
                data-testid={`shot-render-failed-${shotTestIdSuffix}`}
              >
                {t("script_project.shot_render_failed.label")}
              </Text>
            </SceneNoticeCard>
          )}
          {isVideoViewSelected && blockingEntityClauses.length > 0 && (
            <SceneNoticeCard severity="error">
              <Text
                variant="xs"
                color="glyph-error"
                data-testid={`shot-blocked-${shotTestIdSuffix}`}
              >
                {t("script_project.shot_blocked.label", {
                  entities: blockingEntityClauses.join(", ")
                })}
              </Text>
            </SceneNoticeCard>
          )}
          {isVideoViewSelected && isShotBlockedForNoReferenceImage && (
            <SceneNoticeCard severity="error">
              <Text
                variant="xs"
                color="glyph-error"
                data-testid={`shot-no-reference-image-${shotTestIdSuffix}`}
              >
                {t("script_project.shot_blocked_no_reference_image.label")}
              </Text>
            </SceneNoticeCard>
          )}
          {isVideoViewSelected && sequentialBlockedLabelKey && (
            <SceneNoticeCard severity="error">
              <Text
                variant="xs"
                color="glyph-error"
                data-testid={`shot-sequential-blocked-${shotTestIdSuffix}`}
              >
                {t(sequentialBlockedLabelKey)}
              </Text>
            </SceneNoticeCard>
          )}
        </>
      )}
    </div>
  );
};
