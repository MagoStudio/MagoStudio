import { useLocalSheetModelInstallGate } from "@app/components/LocalSetupWizard/hooks/useLocalSheetModelInstallGate";
import { SetupMagoStudioButton } from "@app/components/LocalSetupWizard/SetupMagoStudioButton";
import { Accordion } from "@components/Accordion";
import { Checkbox } from "@components/Checkbox";
import { Dropdown } from "@components/Dropdown";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { usePlanDetail } from "@domains/plan/usePlanDetail";
import { useProject } from "@domains/project/useProject";
import {
  SHEET_RESOLUTION_LABEL_KEY_BY_RESOLUTION,
  SHEET_RESOLUTIONS
} from "@domains/scriptProject/constants";
import { useDescribeSheetGroup } from "@domains/scriptProject/useDescribeSheetGroup";
import { useEditSheetGroup } from "@domains/scriptProject/useEditSheetGroup";
import { useGenerateProjectSheets } from "@domains/scriptProject/useGenerateProjectSheets";
import { usePinSheetGroupImage } from "@domains/scriptProject/usePinSheetGroupImage";
import { useProjectScriptVersions } from "@domains/scriptProject/useProjectScriptVersions";
import { useProjectSheetsDryRun } from "@domains/scriptProject/useProjectSheetsDryRun";
import { useRenderSheetGroup } from "@domains/scriptProject/useRenderSheetGroup";
import { useSheetOutputSize } from "@domains/scriptProject/useSheetOutputSize";
import { useSheetRenderModel } from "@domains/scriptProject/useSheetRenderModel";
import { useShotsByDropped } from "@domains/scriptProject/useShotsByDropped";
import { useUploadSheetGroupImage } from "@domains/scriptProject/useUploadSheetGroupImage";
import { useUploadSheetGroupReference } from "@domains/scriptProject/useUploadSheetGroupReference";
import { buildSheetImageUrlIndex } from "@domains/scriptProject/utils/buildSheetImageUrlIndex";
import { countShotsTaggingEntity } from "@domains/scriptProject/utils/countShotsTaggingEntity";
import { estimateSheetImageCredits } from "@domains/scriptProject/utils/estimateSheetImageCredits";
import { filterSheetGroupsByQuery } from "@domains/scriptProject/utils/filterSheetGroupsByQuery";
import { groupSheetGroupsByDesignFamily } from "@domains/scriptProject/utils/groupSheetGroupsByDesignFamily";
import { groupSheetGroupsByKind } from "@domains/scriptProject/utils/groupSheetGroupsByKind";
import { isSheetGroupRendering } from "@domains/scriptProject/utils/isSheetGroupRendering";
import { isSheetRenderModel } from "@domains/scriptProject/utils/isSheetRenderModel";
import { normaliseSearchQuery } from "@domains/scriptProject/utils/normaliseSearchQuery";
import { partitionSheetGroupsByEnabled } from "@domains/scriptProject/utils/partitionSheetGroupsByEnabled";
import { partitionSkippedAsPinnedUpload } from "@domains/scriptProject/utils/partitionSkippedAsPinnedUpload";
import { partitionSkippedByRenderProgress } from "@domains/scriptProject/utils/partitionSkippedByRenderProgress";
import { resolveScriptCastingOption } from "@domains/scriptProject/utils/resolveScriptCastingOption";
import { resolveSheetRenderPrompt } from "@domains/scriptProject/utils/resolveSheetRenderPrompt";
import { RenderMode } from "@hooks/types";
import { ProjectState, SheetKind } from "@schemas/scriptProject";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AddEntityDialog } from "./AddEntityDialog";
import { ConfirmPinDialog } from "./ConfirmPinDialog";
import { ConfirmRemoveEntityDialog } from "./ConfirmRemoveEntityDialog";
import { EarlierScriptVersionToggle } from "./EarlierScriptVersionToggle";
import { GenerateRunButton } from "./GenerateRunButton";
import { NothingToGenerateReason } from "./NothingToGenerateReason";
import { PendingSheetGroupCard } from "./PendingSheetGroupCard";
import { ProjectVisualStyleField } from "./ProjectVisualStyleField";
import { SheetGroupRow } from "./SheetGroupRow";
import { SheetRenderModelDropdown } from "./SheetRenderModelDropdown";
import { SheetGroupDraft } from "./utils/sheetGroupDraft";

const SECTION_LABEL_KEY: Record<SheetKind, string> = {
  character: "script_project.section_character.label",
  environment: "script_project.section_environment.label",
  prop: "script_project.section_prop.label"
};

type Props = {
  projectId: string;
  projectState: ProjectState;
  renderingSheetTokens: Set<string>;
  isRunActive: boolean;
  canRender: boolean;
  onRunStarted: (planId: string, sheetTokens: string[]) => void;
};

export const AssetsTab: React.FC<Props> = ({
  projectId,
  projectState,
  renderingSheetTokens,
  isRunActive,
  canRender,
  onRunStarted
}) => {
  const { t } = useTranslation();
  const { data: project } = useProject(projectId);
  const { data: versionList } = useProjectScriptVersions(projectId);
  const activeVersion = versionList?.versions.find(
    (version) => version.version === versionList.active_version
  );
  const { data: activeCastingPlan } = usePlanDetail(
    activeVersion?.plan_id ?? ""
  );
  const isLocalProject = project?.origin === "local";
  const {
    sheetOutputSize,
    sheetResolution,
    setSheetResolution,
    isSavingSheetResolution
  } = useSheetOutputSize(projectId);
  const {
    sheetRenderModel,
    setSheetRenderModel,
    isSavingSheetRenderModel,
    canUseCloudSheetModels
  } = useSheetRenderModel(projectId);
  const { isLocalSheetModelInstalled, requiredLocalInstall } =
    useLocalSheetModelInstallGate({ sheetRenderModel, isLocalProject });
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSectionKinds, setCollapsedSectionKinds] = useState<string[]>(
    []
  );
  const [sheetGroupDraft, setSheetGroupDraft] =
    useState<SheetGroupDraft | null>(null);
  const [pendingNewSheetGroups, setPendingNewSheetGroups] = useState<
    { token: string; name: string }[]
  >([]);
  const [shouldScoreImages, setShouldScoreImages] = useState(false);
  const [expandedSectionKeys, setExpandedSectionKeys] = useState<string[]>([]);
  const [expandedDesignFamilyKeys, setExpandedDesignFamilyKeys] = useState<
    string[]
  >([]);
  const [areEarlierVersionEntitiesShown, setAreEarlierVersionEntitiesShown] =
    useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{
    token: string;
    entityName: string;
    taggedShotCount: number;
  } | null>(null);
  const [pendingPin, setPendingPin] = useState<{
    token: string;
    entityName: string;
    assetId: string | null;
    staleShotCount: number;
  } | null>(null);

  const { data: dryRun, isFetching: isDryRunFetching } = useProjectSheetsDryRun(
    projectId,
    sheetOutputSize,
    { render_model: sheetRenderModel },
    canRender
  );
  const { mutate: generateSheets, isPending: isGeneratingSheets } =
    useGenerateProjectSheets();
  const { mutate: pinSheetImage, isPending: isPinningSheetImage } =
    usePinSheetGroupImage(projectId);
  const {
    mutate: editSheetGroup,
    mutateAsync: editSheetGroupAsync,
    isPending: isEditingSheetGroup
  } = useEditSheetGroup(projectId);
  const { mutate: renderSheetGroup, isPending: isRenderingSheetGroup } =
    useRenderSheetGroup(projectId);
  const {
    uploadSheetGroupImage,
    isUploadingSheetGroupImage,
    uploadingSheetGroupTokens
  } = useUploadSheetGroupImage(projectId);
  const { mutate: describeSheetGroup, isPending: isDescribingSheetGroup } =
    useDescribeSheetGroup(projectId);

  const uploadSheetGroupReference = useUploadSheetGroupReference(projectId);
  const imageUrlsByAssetId = buildSheetImageUrlIndex(projectState.keys);

  /* A re-cast leaves the Shots it dropped fully live, so counting every Shot that tags an entity
   * told the user about re-renders those superseded Shots would never trigger. */
  const { shotsInActiveScript } = useShotsByDropped(projectId);

  const { enabledGroups, disabledGroups } = partitionSheetGroupsByEnabled(
    projectState.keys
  );
  const hasDesignVersions = groupSheetGroupsByDesignFamily(enabledGroups).some(
    (family) => family.hasVersions
  );
  const requestedDesignVersions =
    isLocalProject &&
    resolveScriptCastingOption(
      activeVersion,
      activeCastingPlan,
      "split_alts"
    ) === true;

  const sheetsTimelineId = projectState.sheets_timeline_id;
  const listedSheetGroupTokens = projectState.keys.map((group) => group.token);
  const isAnyPendingNewSheetGroupListed = pendingNewSheetGroups.some(
    (pending) => listedSheetGroupTokens.includes(pending.token)
  );
  if (isAnyPendingNewSheetGroupListed)
    setPendingNewSheetGroups(
      pendingNewSheetGroups.filter(
        (pending) => !listedSheetGroupTokens.includes(pending.token)
      )
    );
  const showPendingNewSheetGroup = (token: string, name: string) =>
    setPendingNewSheetGroups((pending) => [...pending, { token, name }]);
  const forgetPendingNewSheetGroup = (token: string) =>
    setPendingNewSheetGroups((pending) =>
      pending.filter((candidate) => candidate.token !== token)
    );
  const creditsPerSheetImage = isSheetRenderModel(sheetRenderModel)
    ? estimateSheetImageCredits(sheetRenderModel, sheetOutputSize)
    : 0;
  /* The dry run reports every entity, including the ones a later cast disabled. Those are not
   * on screen and cannot be rendered, so counting them told the user about work that does not
   * exist. */
  const enabledTokens = new Set(enabledGroups.map((group) => group.token));
  const staleEnabledTokens = (dryRun?.would_run ?? []).filter((token) =>
    enabledTokens.has(token)
  );
  const staleKeyCount = staleEnabledTokens.length;
  const isEveryEntityUpToDate =
    !!dryRun && enabledGroups.length > 0 && staleKeyCount === 0;
  const { skippedAsUnchangedEntries, skippedAsRenderInProgressEntries } =
    partitionSkippedByRenderProgress(
      (dryRun?.skipped ?? []).filter((entry) => enabledTokens.has(entry.token))
    );
  const { skippedAsPinnedUploadEntries, otherSkippedEntries } =
    partitionSkippedAsPinnedUpload(skippedAsUnchangedEntries);
  const pinnedUploadKeyCount = skippedAsPinnedUploadEntries.length;
  const unchangedKeyCount = otherSkippedEntries.length;
  const renderInProgressKeyCount = skippedAsRenderInProgressEntries.length;
  const isBusyWithAnythingButImageUploads =
    isPinningSheetImage ||
    isEditingSheetGroup ||
    isRenderingSheetGroup ||
    isDescribingSheetGroup;
  const isBusy =
    isBusyWithAnythingButImageUploads || isUploadingSheetGroupImage;

  const startSheetGeneration = () =>
    generateSheets(
      {
        projectId,
        isDryRun: false,
        outputSize: sheetOutputSize,
        settings: {
          render_model: sheetRenderModel
        },
        shouldScoreImages: isLocalProject ? false : shouldScoreImages
      },
      {
        onSuccess: (result) => {
          if (result.plan_id) onRunStarted(result.plan_id, result.would_run);
        }
      }
    );

  if (!sheetsTimelineId) {
    return (
      <div className="p-6">
        <Text variant="sm" color="glyph-tertiary">
          {t("script_project.assets_empty_state.label")}
        </Text>
      </div>
    );
  }

  const isSearching = normaliseSearchQuery(searchQuery).length > 0;

  const matchingEnabledGroups = filterSheetGroupsByQuery(
    enabledGroups,
    searchQuery
  );
  const matchingDisabledGroups = filterSheetGroupsByQuery(
    disabledGroups,
    searchQuery
  );

  /* Removed entities sit in their own section under the live cast rather than inline: they
   * cannot render, so mixing them into Characters would make that list read as bigger than the
   * work it represents. Collapsed by default, and never counted. */
  const sections = [
    ...groupSheetGroupsByKind(matchingEnabledGroups).map((section) => ({
      key: section.kind ?? "uncategorised",
      label: section.kind
        ? t(SECTION_LABEL_KEY[section.kind])
        : t("script_project.section_uncategorised.label"),
      isCollapsedByDefault: false,
      groups: section.groups
    })),
    ...(areEarlierVersionEntitiesShown && matchingDisabledGroups.length > 0
      ? [
          {
            key: "removed-from-cast",
            label: t("script_project.section_removed_from_cast.label"),
            isCollapsedByDefault: true,
            groups: matchingDisabledGroups
          }
        ]
      : [])
  ];

  const createSheetGroupWithFirstRender = (entity: {
    token: string;
    name: string;
    kind: SheetKind;
    prompt: string;
    referenceAssetIds: string[];
    referenceInstruction: string;
  }) => {
    if (!sheetsTimelineId) return;

    showPendingNewSheetGroup(entity.token, entity.name);
    renderSheetGroup(
      {
        isNewSheetGroup: true,
        timelineId: sheetsTimelineId,
        token: entity.token,
        name: entity.name,
        kind: entity.kind,
        prompt: entity.prompt,
        ...(entity.referenceAssetIds.length > 0
          ? {
              referenceAssetIds: entity.referenceAssetIds,
              referenceInstruction: entity.referenceInstruction
            }
          : {}),
        renderModel: sheetRenderModel,
        renderMode: RenderMode.CREDITS,
        outputSize: sheetOutputSize
      },
      {
        onSuccess: (result) => {
          if (result?.plan_id) onRunStarted(result.plan_id, result.would_run);
        },
        onError: () => forgetPendingNewSheetGroup(entity.token)
      }
    );
  };

  /* The backend records a per-key re-render's fingerprint only when the prompt sent matches the
   * key's STORED prompt. Saving an unsaved edit first is what makes them match â€” otherwise the
   * render lands, records nothing, and the next bulk run bills for the same image again. */
  const rerenderSheetGroupFromSavedFields = async (
    group: ProjectState["keys"][number],
    draft: {
      description: string;
      prompt: string;
      hasUnsavedEdits: boolean;
      referenceAssetIds: string[];
      referenceInstruction: string;
    }
  ) => {
    if (!sheetsTimelineId) return;

    if (draft.hasUnsavedEdits) {
      await editSheetGroupAsync({
        timelineId: sheetsTimelineId,
        token: group.token,
        description: draft.description,
        prompt: draft.prompt
      });
    }

    renderSheetGroup(
      {
        timelineId: sheetsTimelineId,
        token: group.token,
        name: group.name,
        kind: group.kind ?? null,
        masterToken: group.master_token,
        prompt: resolveSheetRenderPrompt({
          prompt: draft.prompt,
          description: draft.description,
          token: group.token
        }),
        renderModel: sheetRenderModel,
        renderMode: RenderMode.CREDITS,
        outputSize: sheetOutputSize,
        referenceAssetIds: draft.referenceAssetIds,
        referenceInstruction: draft.referenceInstruction
      },
      {
        onSuccess: (result) => {
          if (result?.plan_id) onRunStarted(result.plan_id, result.would_run);
        }
      }
    );
  };

  const renderSheetGroupRow = (group: ProjectState["keys"][number]) => (
    <SheetGroupRow
      key={`${group.token}:${(group.reference_asset_ids ?? []).join(",")}:${group.reference_instruction ?? ""}`}
      projectId={projectId}
      timelineId={sheetsTimelineId}
      group={group}
      imageUrlsByAssetId={imageUrlsByAssetId}
      changedPaths={dryRun?.changed?.[group.token]}
      isRendering={isSheetGroupRendering(group, renderingSheetTokens)}
      onUploadImage={(file) =>
        void uploadSheetGroupImage({
          timelineId: sheetsTimelineId,
          token: group.token,
          file
        })
      }
      onUploadReference={uploadSheetGroupReference}
      isBusy={isBusy}
      isBusyWithAnythingButImageUploads={isBusyWithAnythingButImageUploads}
      isUploadingImage={uploadingSheetGroupTokens.includes(group.token)}
      isRunActive={isRunActive}
      isRenderDisabled={!canRender}
      renderCost={
        !project
          ? null
          : isSheetRenderModel(sheetRenderModel)
            ? { kind: "credits", amount: creditsPerSheetImage }
            : { kind: "local" }
      }
      supportsImageReferences={isLocalProject || canRender}
      isCharacterVoiceAvailableForProject={!isLocalProject}
      onPin={(assetId) => {
        const staleShotCount = countShotsTaggingEntity(
          shotsInActiveScript,
          group.token
        );
        if (staleShotCount === 0) {
          pinSheetImage({
            timelineId: sheetsTimelineId,
            token: group.token,
            selectedAssetId: assetId
          });
          return;
        }
        setPendingPin({
          token: group.token,
          entityName: group.name,
          assetId,
          staleShotCount
        });
      }}
      onSaveFields={(fields) =>
        editSheetGroup({
          timelineId: sheetsTimelineId,
          token: group.token,
          ...fields
        })
      }
      onToggleEnabled={() => {
        if (!group.enabled) {
          editSheetGroup({
            timelineId: sheetsTimelineId,
            token: group.token,
            enabled: true
          });
          return;
        }
        setPendingRemoval({
          token: group.token,
          entityName: group.name,
          taggedShotCount: countShotsTaggingEntity(
            shotsInActiveScript,
            group.token
          )
        });
      }}
      onDescribeFromImage={(assetId) =>
        describeSheetGroup({
          timelineId: sheetsTimelineId,
          token: group.token,
          assetId
        })
      }
      onRerender={(draft) =>
        void rerenderSheetGroupFromSavedFields(group, draft)
      }
    />
  );

  const isLocalSheetRenderLocked = !isLocalSheetModelInstalled;

  const generateSheetsButton = (
    <GenerateRunButton
      label={t("script_project.generate_sheets_button.label")}
      countLabel={t("script_project.generate_sheets_button.count", {
        count: staleKeyCount
      })}
      cost={
        !project
          ? null
          : isSheetRenderModel(sheetRenderModel)
            ? {
                kind: "credits",
                amount: staleKeyCount * creditsPerSheetImage
              }
            : { kind: "local" }
      }
      isDisabled={
        !canRender ||
        staleKeyCount === 0 ||
        isGeneratingSheets ||
        isRunActive ||
        isLocalSheetRenderLocked
      }
      isPending={isGeneratingSheets || isRunActive}
      isPriceLoading={
        isDryRunFetching || isSavingSheetRenderModel || isSavingSheetResolution
      }
      onPress={startSheetGeneration}
      testId="script-project-generate-sheets"
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ConfirmRemoveEntityDialog
        isOpen={!!pendingRemoval}
        entityName={pendingRemoval?.entityName ?? ""}
        taggedShotCount={pendingRemoval?.taggedShotCount ?? 0}
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (pendingRemoval) {
            editSheetGroup({
              timelineId: sheetsTimelineId,
              token: pendingRemoval.token,
              enabled: false
            });
          }
          setPendingRemoval(null);
        }}
      />
      <ConfirmPinDialog
        isOpen={!!pendingPin}
        entityName={pendingPin?.entityName ?? ""}
        staleShotCount={pendingPin?.staleShotCount ?? 0}
        onCancel={() => setPendingPin(null)}
        onConfirm={() => {
          if (pendingPin) {
            pinSheetImage({
              timelineId: sheetsTimelineId,
              token: pendingPin.token,
              selectedAssetId: pendingPin.assetId
            });
          }
          setPendingPin(null);
        }}
      />
      <div className="flex items-center gap-3 border-b border-element-primary px-6 py-3">
        <div className="flex flex-1 items-center justify-end gap-3">
          {renderInProgressKeyCount > 0 && (
            <Text variant="xs" color="glyph-tertiary">
              {t("script_project.dry_run_render_in_progress.label", {
                count: renderInProgressKeyCount
              })}
            </Text>
          )}
          {pinnedUploadKeyCount > 0 && (
            <Text variant="xs" color="glyph-tertiary">
              {t("script_project.dry_run_pinned_upload.label", {
                count: pinnedUploadKeyCount
              })}
            </Text>
          )}
          {unchangedKeyCount > 0 && (
            <Text variant="xs" color="glyph-tertiary">
              {t("script_project.dry_run_skipped.label", {
                count: unchangedKeyCount
              })}
            </Text>
          )}
          <MainButton
            size="md"
            colorScheme="secondary"
            isDisabled={!canRender || isBusy || isRunActive}
            onPress={() =>
              setSheetGroupDraft({
                draftId: crypto.randomUUID(),
                name: "",
                kind: "character",
                prompt: "",
                referenceAssetIds: [],
                referenceInstruction: ""
              })
            }
            data-testid="script-project-add-entity"
          >
            {t("script_project.add_entity_button.label")}
          </MainButton>
          <SheetRenderModelDropdown
            sheetRenderModel={sheetRenderModel}
            isDisabled={isSavingSheetRenderModel || isRunActive}
            onChange={setSheetRenderModel}
            isLocalProject={isLocalProject}
            includeCloudModels={canUseCloudSheetModels}
            isLabelHidden
            testId="script-project-assets-render-model"
          />
          <Dropdown
            aria-label={t("script_project.sheet_resolution_input.label")}
            selectedKey={sheetResolution}
            isDisabled={
              isSavingSheetResolution ||
              isGeneratingSheets ||
              isRunActive ||
              isBusy
            }
            items={SHEET_RESOLUTIONS.map((resolution) => ({
              key: resolution,
              label: t(SHEET_RESOLUTION_LABEL_KEY_BY_RESOLUTION[resolution])
            }))}
            onSelectionChange={(key) => {
              if (key === "1m" || key === "2m") setSheetResolution(key);
            }}
            className="w-28"
            data-testid="script-project-sheet-resolution"
          />
          <Checkbox
            inputId="script-project-score-assets"
            isChecked={isLocalProject ? false : shouldScoreImages}
            disabled={isLocalProject || isGeneratingSheets || isRunActive}
            onChange={(event) => setShouldScoreImages(event.target.checked)}
            label={t("script_project.score_assets_toggle.label")}
          />
          <NothingToGenerateReason
            reason={
              isEveryEntityUpToDate
                ? t("script_project.toolbar_nothing_to_generate.noChanges")
                : undefined
            }
            isPending={isGeneratingSheets || isRunActive}
            isPriceLoading={
              isDryRunFetching ||
              isSavingSheetRenderModel ||
              isSavingSheetResolution
            }
            testId="script-project-generate-sheets"
          />
          {isLocalSheetRenderLocked ? (
            <SetupMagoStudioButton
              requiredLocalInstall={requiredLocalInstall}
              lockedRenderButton={generateSheetsButton}
            />
          ) : (
            generateSheetsButton
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
        <ProjectVisualStyleField key={projectId} projectId={projectId} />
        {requestedDesignVersions && !hasDesignVersions && (
          <Text
            variant="xs"
            color="glyph-tertiary"
            data-testid="script-project-no-design-versions"
          >
            {t("script_project.no_design_versions_found.label")}
          </Text>
        )}
        <EarlierScriptVersionToggle
          hiddenCount={disabledGroups.length}
          areHiddenItemsShown={areEarlierVersionEntitiesShown}
          onToggle={() =>
            setAreEarlierVersionEntitiesShown(!areEarlierVersionEntitiesShown)
          }
          inputId="script-project-toggle-disabled-entities"
          testId="script-project-toggle-disabled-entities"
        />
        {sheetGroupDraft && (
          <AddEntityDialog
            draft={sheetGroupDraft}
            existingTokens={[
              ...listedSheetGroupTokens,
              ...pendingNewSheetGroups.map((pending) => pending.token)
            ]}
            isBusy={isBusy || isRunActive}
            isBusyWithAnythingButImageUploads={
              isBusyWithAnythingButImageUploads || isRunActive
            }
            onChange={setSheetGroupDraft}
            onRender={(newSheetGroup) => {
              createSheetGroupWithFirstRender(newSheetGroup);
              setSheetGroupDraft(null);
            }}
            onUploadImage={(newSheetGroup, file) => {
              showPendingNewSheetGroup(newSheetGroup.token, newSheetGroup.name);
              void uploadSheetGroupImage({
                timelineId: sheetsTimelineId,
                token: newSheetGroup.token,
                file,
                nameForNewSheetGroup: newSheetGroup.name,
                kindForNewSheetGroup: newSheetGroup.kind
              }).then((isImageFiled) => {
                if (!isImageFiled)
                  forgetPendingNewSheetGroup(newSheetGroup.token);
              });
              setSheetGroupDraft(null);
            }}
            onUploadReference={uploadSheetGroupReference}
            onDiscard={() => setSheetGroupDraft(null)}
          />
        )}
        {pendingNewSheetGroups.length > 0 && (
          <div className="grid grid-cols-2 items-start gap-3">
            {pendingNewSheetGroups.map((pending) => (
              <PendingSheetGroupCard
                key={pending.token}
                name={pending.name}
                token={pending.token}
              />
            ))}
          </div>
        )}
        {sections.length === 0 && pendingNewSheetGroups.length === 0 && (
          <Text variant="sm" color="glyph-tertiary">
            {isSearching
              ? t("script_project.no_search_results.label", {
                  query: searchQuery.trim()
                })
              : t("script_project.assets_empty_state.label")}
          </Text>
        )}
        {sections.map((section) => {
          const sectionKey = section.key;
          const isCollapsed = section.isCollapsedByDefault
            ? !expandedSectionKeys.includes(sectionKey)
            : collapsedSectionKinds.includes(sectionKey);

          return (
            <Accordion
              key={sectionKey}
              panelIndent="flush"
              label={`${section.label} (${section.groups.length})`}
              isExpanded={isSearching || !isCollapsed}
              onExpandedChange={(isExpanded) => {
                if (section.isCollapsedByDefault) {
                  setExpandedSectionKeys((expanded) =>
                    isExpanded
                      ? [...expanded, sectionKey]
                      : expanded.filter((key) => key !== sectionKey)
                  );
                  return;
                }
                setCollapsedSectionKinds((collapsed) =>
                  isExpanded
                    ? collapsed.filter((kind) => kind !== sectionKey)
                    : [...collapsed, sectionKey]
                );
              }}
            >
              <div className="grid grid-cols-2 items-start gap-3 pt-3">
                {groupSheetGroupsByDesignFamily(section.groups).map((family) =>
                  family.hasVersions ? (
                    <div key={family.key} className="col-span-2">
                      <Accordion
                        label={`${family.label} (${family.groups.length})`}
                        isExpanded={
                          isSearching ||
                          expandedDesignFamilyKeys.includes(family.key)
                        }
                        onExpandedChange={(isExpanded) =>
                          setExpandedDesignFamilyKeys((expanded) =>
                            isExpanded
                              ? [...new Set([...expanded, family.key])]
                              : expanded.filter((key) => key !== family.key)
                          )
                        }
                      >
                        <div className="grid grid-cols-2 items-start gap-3">
                          {family.groups.map(renderSheetGroupRow)}
                        </div>
                      </Accordion>
                    </div>
                  ) : (
                    family.groups.map(renderSheetGroupRow)
                  )
                )}
              </div>
            </Accordion>
          );
        })}
      </div>
    </div>
  );
};
