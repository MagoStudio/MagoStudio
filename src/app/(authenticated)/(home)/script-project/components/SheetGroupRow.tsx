import { AnimatedGradient } from "@components/AnimatedGradient";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { SheetImageUrls } from "@domains/scriptProject/utils/buildSheetImageUrlIndex";
import { findNewestSuccessfulSheetImage } from "@domains/scriptProject/utils/findNewestSuccessfulSheetImage";
import { sheetGroupDesignLabel } from "@domains/scriptProject/utils/groupSheetGroupsByDesignFamily";
import {
  DRAFT_SAVING_ACTION_ATTRIBUTE,
  isFocusMovingToDraftSavingAction
} from "@domains/scriptProject/utils/isFocusMovingToDraftSavingAction";
import { isNewerSheetVersionAvailableThanPinned } from "@domains/scriptProject/utils/isNewerSheetVersionAvailableThanPinned";
import { isSheetImageRendering } from "@domains/scriptProject/utils/isSheetImageRendering";
import { resolveSheetRenderBlockedReasonKey } from "@domains/scriptProject/utils/resolveSheetRenderBlockedReasonKey";
import { useDraftValue } from "@hooks/useDraftValue";
import { SheetGroup } from "@schemas/scriptProject";
import { cn } from "@utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AddImageDropTile } from "./AddImageDropTile";
import { ChangedFieldsNote } from "./ChangedFieldsNote";
import { RenderCostLabel, ScriptProjectRenderCost } from "./RenderCostLabel";
import { RenderingBadge } from "./RenderingBadge";
import {
  SheetGroupReferences,
  getSheetGroupReferenceLimit
} from "./SheetGroupReferences";
import { SheetImageCard } from "./SheetImageCard";
import { SheetImageInputsPanel } from "./SheetImageInputsPanel";
export {
  MAX_SHEET_GROUP_REFERENCE_IMAGES,
  getSheetGroupReferenceLimit
} from "./SheetGroupReferences";

type Props = {
  group: SheetGroup;
  imageUrlsByAssetId: Map<string, SheetImageUrls>;
  isRendering: boolean;
  changedPaths: string[] | undefined;
  onPin: (assetId: string | null) => void;
  onSaveFields: (fields: {
    description?: string;
    prompt?: string;
    referenceAssetIds?: string[] | null;
    referenceInstruction?: string | null;
  }) => void;
  onToggleEnabled: () => void;
  onRerender: (draft: {
    description: string;
    prompt: string;
    hasUnsavedEdits: boolean;
    referenceAssetIds: string[];
    referenceInstruction: string;
  }) => void;
  onUploadReference: (file: File) => Promise<string | undefined>;
  isRunActive: boolean;
  onUploadImage: (file: File) => void;
  onDescribeFromImage: (assetId: string) => void;
  isBusy: boolean;
  isRenderDisabled: boolean;
  renderCost: ScriptProjectRenderCost;
  shouldFetchImageInputs: boolean;
  supportsImageReferences: boolean;
};

export const SheetGroupRow: React.FC<Props> = ({
  group,
  imageUrlsByAssetId,
  isRendering,
  changedPaths,
  onPin,
  onSaveFields,
  onToggleEnabled,
  onRerender,
  onUploadReference,
  onDescribeFromImage,
  onUploadImage,
  isBusy,
  isRenderDisabled,
  renderCost,
  shouldFetchImageInputs,
  supportsImageReferences,
  isRunActive
}) => {
  const { t } = useTranslation();
  const {
    draftValue: draftPrompt,
    setDraftValue: setDraftPrompt,
    isDraftDirty: hasUnsavedPrompt
  } = useDraftValue(group.prompt ?? "");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [referenceAssetIds, setReferenceAssetIds] = useState(
    group.reference_asset_ids ?? []
  );
  const savedReferenceIds = JSON.stringify(group.reference_asset_ids ?? []);
  const [seededReferenceIds, setSeededReferenceIds] =
    useState(savedReferenceIds);
  if (seededReferenceIds !== savedReferenceIds) {
    setSeededReferenceIds(savedReferenceIds);
    if (JSON.stringify(referenceAssetIds) === seededReferenceIds)
      setReferenceAssetIds(group.reference_asset_ids ?? []);
  }
  const [isUploadingReference, setIsUploadingReference] = useState(false);
  const {
    draftValue: referenceInstruction,
    setDraftValue: setReferenceInstruction
  } = useDraftValue(group.reference_instruction ?? "");
  const referencesDirty =
    JSON.stringify(referenceAssetIds) !==
      JSON.stringify(group.reference_asset_ids ?? []) ||
    referenceInstruction !== (group.reference_instruction ?? "");
  const commitReferences = (
    ids = referenceAssetIds,
    instruction = referenceInstruction
  ) => {
    onSaveFields({
      referenceAssetIds: ids,
      referenceInstruction: ids.length ? instruction.trim() : null
    });
  };
  const changeReferences = (ids: string[], instruction: string) => {
    const isFirstReferenceBeingAdded =
      referenceAssetIds.length === 0 && ids.length > 0;
    const nextInstruction =
      isFirstReferenceBeingAdded && !instruction.trim()
        ? t("script_project.asset_references.default_instruction")
        : instruction;
    setReferenceAssetIds(ids);
    setReferenceInstruction(nextInstruction);
    if (JSON.stringify(ids) !== JSON.stringify(referenceAssetIds))
      commitReferences(ids, nextInstruction);
  };

  const renderBlockedReasonKey = resolveSheetRenderBlockedReasonKey({
    isRunActive,
    isUploadingReference
  });

  const hasUnsavedEdits = hasUnsavedPrompt;
  const groupDescription = group.description ?? "";
  const groupSeedDescription = group.seed_description ?? "";
  const selectedImage = group.images.find(
    (image) => image.asset_id === selectedAssetId
  );
  const shouldBadgeNewerVersion = isNewerSheetVersionAvailableThanPinned(group);
  const newestSuccessfulImage = findNewestSuccessfulSheetImage(group);
  const designLabel = sheetGroupDesignLabel(group);
  const isRerenderDisabled =
    isRenderDisabled ||
    isRunActive ||
    isBusy ||
    !group.enabled ||
    isUploadingReference;

  return (
    <div
      data-testid={`sheet-group-${group.token}`}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-element-primary bg-surface-secondary p-4",
        !group.enabled && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Text variant="md" weight="semibold">
            {group.name}
          </Text>
          {designLabel && (
            <Text variant="xs" color="glyph-secondary">
              {designLabel}
            </Text>
          )}
          <Text variant="xs" color="glyph-tertiary">
            {group.token}
          </Text>
          {!group.enabled && (
            <Text variant="xs" color="glyph-warning">
              {t("script_project.disabled_entity_badge.label")}
            </Text>
          )}
          {group.effective_source === "upload" && (
            <Text variant="xs" color="glyph-secondary">
              {t("script_project.pinned_upload_hint.label")}
            </Text>
          )}
          {isRendering && (
            <RenderingBadge testId={`sheet-group-rendering-${group.token}`} />
          )}
        </div>
        <div className="flex items-center gap-2">
          {renderBlockedReasonKey && (
            <Text
              variant="2xs"
              color="glyph-tertiary"
              data-testid={`sheet-group-render-blocked-${group.token}`}
            >
              {t(renderBlockedReasonKey)}
            </Text>
          )}
          <MainButton
            size="sm"
            colorScheme="secondary"
            isDisabled={isBusy}
            onPress={onToggleEnabled}
            data-testid={`sheet-group-toggle-${group.token}`}
          >
            {group.enabled
              ? t("script_project.disable_entity_button.label")
              : t("script_project.enable_entity_button.label")}
          </MainButton>
          <MainButton
            size="sm"
            colorScheme="primary"
            isDisabled={isRerenderDisabled}
            onPress={() =>
              onRerender({
                description: groupDescription,
                prompt: draftPrompt,
                hasUnsavedEdits,
                referenceAssetIds,
                referenceInstruction: referenceInstruction.trim()
              })
            }
            {...{ [DRAFT_SAVING_ACTION_ATTRIBUTE]: "true" }}
            data-testid={`sheet-group-rerender-${group.token}`}
          >
            <span className="flex items-center gap-1.5">
              {newestSuccessfulImage
                ? t("script_project.rerender_button.label")
                : t("script_project.render_button.label")}
              <RenderCostLabel
                cost={renderCost}
                isDisabled={isRerenderDisabled}
              />
            </span>
          </MainButton>
        </div>
      </div>

      {supportsImageReferences && (
        <SheetGroupReferences
          token={group.token}
          limit={getSheetGroupReferenceLimit(group.master_token)}
          assetIds={referenceAssetIds}
          instruction={referenceInstruction}
          isDisabled={isBusy}
          onChange={changeReferences}
          onCommit={() => {
            if (referencesDirty) commitReferences();
          }}
          onUpload={async (file) => {
            setIsUploadingReference(true);
            try {
              return await onUploadReference(file);
            } finally {
              setIsUploadingReference(false);
            }
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-3">
        <div className="flex flex-col gap-1.5">
          <Text variant="xs" color="glyph-secondary">
            {t("script_project.entity_prompt_input.label")}
          </Text>
          <Textarea
            className="min-h-16"
            autoResize
            resize="vertical"
            value={draftPrompt}
            onChange={(event) => setDraftPrompt(event.target.value)}
            onBlur={(event) => {
              if (!hasUnsavedEdits) return;
              if (isFocusMovingToDraftSavingAction(event.relatedTarget)) return;
              onSaveFields({
                description: groupDescription,
                prompt: draftPrompt
              });
            }}
            data-testid={`sheet-group-prompt-${group.token}`}
          />
          <Text variant="2xs" color="glyph-tertiary">
            {t("script_project.prompt_is_sent_hint.label")}
          </Text>
        </div>
      </div>

      <ChangedFieldsNote
        changedPaths={changedPaths}
        testId={`sheet-group-changed-${group.token}`}
      />

      {shouldBadgeNewerVersion && newestSuccessfulImage && (
        <div className="flex items-center gap-3 rounded-xl bg-surface-primary px-3 py-2">
          <Text variant="xs" color="glyph-warning">
            {t("script_project.newer_version_badge.label")}
          </Text>
          <MainButton
            size="sm"
            colorScheme="secondary"
            isDisabled={isBusy}
            onPress={() => onPin(newestSuccessfulImage.asset_id)}
            data-testid={`sheet-group-use-newest-${group.token}`}
          >
            {t("script_project.use_newest_button.label")}
          </MainButton>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {group.images.map((image) => (
          <SheetImageCard
            key={image.asset_id}
            image={image}
            imageUrls={imageUrlsByAssetId.get(image.asset_id)}
            isPinned={group.selected_asset_id === image.asset_id}
            isEffective={group.effective_asset_id === image.asset_id}
            isSelected={selectedAssetId === image.asset_id}
            onSelect={() =>
              setSelectedAssetId(
                selectedAssetId === image.asset_id ? null : image.asset_id
              )
            }
            onPin={() =>
              onPin(
                group.selected_asset_id === image.asset_id
                  ? null
                  : image.asset_id
              )
            }
          />
        ))}
        {isRendering && !group.images.some(isSheetImageRendering) && (
          <div
            className="relative aspect-square w-48 overflow-hidden rounded-xl border border-element-primary bg-surface-primary"
            data-testid={`sheet-group-rendering-placeholder-${group.token}`}
          >
            <AnimatedGradient />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Text variant="xs" color="glyph-secondary">
                {t("script_project.version_not_ready.label")}
              </Text>
            </div>
          </div>
        )}
        <AddImageDropTile
          onFileChosen={onUploadImage}
          isBusy={isBusy || !group.enabled}
          className="h-auto w-48 min-h-40"
          testId={`sheet-group-drop-${group.token}`}
        />
      </div>

      {selectedImage && (
        <SheetImageInputsPanel
          key={selectedImage.asset_id}
          clipId={selectedImage.clip_id}
          assetId={selectedImage.asset_id}
          description={selectedImage.description}
          hasDescription={selectedImage.has_description}
          seedDescription={groupSeedDescription}
          recordedPrompt={selectedImage.prompt}
          versionName={selectedImage.name ?? selectedImage.asset_id}
          isBusy={isBusy}
          shouldFetchInputs={shouldFetchImageInputs}
          onReusePrompt={setDraftPrompt}
          onDescribeFromImage={() =>
            onDescribeFromImage(selectedImage.asset_id)
          }
        />
      )}
    </div>
  );
};
