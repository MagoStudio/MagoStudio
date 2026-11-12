import { CloseButton } from "@components/CloseButton";
import { Divider } from "@components/Divider";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { MainButton } from "@components/MainButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { SheetImageUrls } from "@domains/scriptProject/utils/buildSheetImageUrlIndex";
import { sheetGroupDesignLabel } from "@domains/scriptProject/utils/groupSheetGroupsByDesignFamily";
import {
  DRAFT_SAVING_ACTION_ATTRIBUTE,
  isFocusMovingToDraftSavingAction
} from "@domains/scriptProject/utils/isFocusMovingToDraftSavingAction";
import { SheetImageVersionSettings } from "@domains/scriptProject/utils/readSheetImageVersionSettings";
import { resolveSheetRenderBlockedReasonKey } from "@domains/scriptProject/utils/resolveSheetRenderBlockedReasonKey";
import { buildVoiceSignatureFromStockVoice } from "@domains/voiceLibrary/utils/buildVoiceSignatureFromStockVoice";
import { useDraftValue } from "@hooks/useDraftValue";
import { SheetGroup, VoiceSignature } from "@schemas/scriptProject";
import { StockVoice } from "@schemas/voiceLibrary";
import { cn } from "@utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AddImageDropTile } from "./AddImageDropTile";
import { ChangedFieldsNote } from "./ChangedFieldsNote";
import { CharacterVoiceCard } from "./CharacterVoiceCard";
import { ElevenLabsVoiceLibrary } from "./ElevenLabsVoiceLibrary";
import { RenderCostLabel, ScriptProjectRenderCost } from "./RenderCostLabel";
import { RenderingBadge } from "./RenderingBadge";
import {
  getSheetGroupReferenceLimit,
  SheetGroupReferences
} from "./SheetGroupReferences";
import { SheetImageCard } from "./SheetImageCard";
import { SheetImageInputsButton } from "./SheetImageInputsButton";

const VOICE_DIALOG_MAX_WIDTH_PX = 720;

type Props = {
  projectId?: string;
  timelineId?: string;
  group: SheetGroup;
  imageUrlsByAssetId: Map<string, SheetImageUrls>;
  isRendering: boolean;
  changedPaths: string[] | undefined;
  onPin: (assetId: string | null) => void;
  onSaveFields: (fields: {
    voiceSignature?: VoiceSignature | null;
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
  isBusyWithAnythingButImageUploads: boolean;
  isUploadingImage: boolean;
  isRenderDisabled: boolean;
  renderCost: ScriptProjectRenderCost;
  supportsImageReferences: boolean;
  isCharacterVoiceAvailableForProject: boolean;
};

export const SheetGroupRow: React.FC<Props> = ({
  projectId,
  timelineId,
  group,
  imageUrlsByAssetId,
  isRendering,
  changedPaths,
  onPin,
  onSaveFields,
  onToggleEnabled,
  onRerender,
  onDescribeFromImage,
  onUploadImage,
  isBusy,
  isBusyWithAnythingButImageUploads,
  isUploadingImage,
  onUploadReference,
  isRunActive,
  isRenderDisabled,
  renderCost,
  supportsImageReferences,
  isCharacterVoiceAvailableForProject
}) => {
  const { t } = useTranslation();
  const {
    draftValue: draftPrompt,
    setDraftValue: setDraftPrompt,
    isDraftDirty: hasUnsavedPrompt
  } = useDraftValue(group.prompt ?? "");
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);
  const isCharacterVoiceAvailable =
    isCharacterVoiceAvailableForProject &&
    group.kind === "character" &&
    !!projectId &&
    !!timelineId;
  const savedVoiceSignature = group.voice_signature ?? null;
  const [draftVoiceSignature, setDraftVoiceSignature] =
    useState<VoiceSignature | null>(null);
  const openVoiceDialog = () => {
    setDraftVoiceSignature(savedVoiceSignature);
    setIsVoiceDialogOpen(true);
  };
  const chooseDraftStockVoice = (stockVoice: StockVoice) =>
    setDraftVoiceSignature(buildVoiceSignatureFromStockVoice(stockVoice));
  const saveDraftVoiceSignature = () => {
    const isDraftVoiceAlreadySaved =
      draftVoiceSignature?.voice_id === savedVoiceSignature?.voice_id;
    if (!isDraftVoiceAlreadySaved)
      onSaveFields({ voiceSignature: draftVoiceSignature });
    setIsVoiceDialogOpen(false);
  };
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

  const reuseVersionSettings = (versionSettings: SheetImageVersionSettings) => {
    if (versionSettings.prompt) setDraftPrompt(versionSettings.prompt);
    const reusedReferenceAssetIds = versionSettings.referenceAssetIds;
    const reusedReferenceInstruction =
      versionSettings.referenceInstruction ?? referenceInstruction;
    setReferenceAssetIds(reusedReferenceAssetIds);
    setReferenceInstruction(reusedReferenceInstruction);
    const areReusedReferencesAlreadySaved =
      JSON.stringify(reusedReferenceAssetIds) ===
        JSON.stringify(group.reference_asset_ids ?? []) &&
      reusedReferenceInstruction === (group.reference_instruction ?? "");
    if (!areReusedReferencesAlreadySaved)
      commitReferences(reusedReferenceAssetIds, reusedReferenceInstruction);
  };

  const renderBlockedReasonKey = resolveSheetRenderBlockedReasonKey({
    isRunActive,
    isUploadingReference
  });

  const hasUnsavedEdits = hasUnsavedPrompt;
  const designLabel = sheetGroupDesignLabel(group);
  const isRerenderDisabled =
    isRenderDisabled ||
    isRunActive ||
    isBusy ||
    !group.enabled ||
    isUploadingReference;
  const groupDescription = group.description ?? "";
  const groupSeedDescription = group.seed_description ?? "";
  const pinnedImage = group.images.find(
    (image) => image.asset_id === group.selected_asset_id
  );
  const unpinnedImages = group.images.filter(
    (image) => image.asset_id !== group.selected_asset_id
  );
  const hasPinnedResultOrVoiceRow = !!pinnedImage || isCharacterVoiceAvailable;
  const hasPinnedResultAndVoice = !!pinnedImage && isCharacterVoiceAvailable;
  const hasOtherVersions = unpinnedImages.length > 0;
  const renderSheetImageCard = (image: SheetGroup["images"][number]) => (
    <SheetImageCard
      key={image.asset_id}
      image={image}
      imageUrls={imageUrlsByAssetId.get(image.asset_id)}
      isPinned={group.selected_asset_id === image.asset_id}
      isEffective={group.effective_asset_id === image.asset_id}
      versionInputsButton={
        <SheetImageInputsButton
          image={image}
          seedDescription={groupSeedDescription}
          versionName={image.name ?? image.asset_id}
          isBusy={isBusy}
          onReuseSettings={reuseVersionSettings}
          onDescribeFromImage={() => onDescribeFromImage(image.asset_id)}
        />
      }
      onPin={() =>
        onPin(
          group.selected_asset_id === image.asset_id ? null : image.asset_id
        )
      }
    />
  );

  return (
    <div
      data-testid={`sheet-group-${group.token}`}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-element-primary bg-surface-secondary p-4",
        !group.enabled && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Text variant="md" weight="semibold">
            {group.name}
          </Text>
          <Text variant="xs" color="glyph-tertiary">
            {group.token}
          </Text>
          {designLabel && (
            <Text variant="xs" color="glyph-secondary">
              {designLabel}
            </Text>
          )}
          {!group.enabled && (
            <Text variant="xs" color="glyph-warning">
              {t("script_project.disabled_entity_badge.label")}
            </Text>
          )}
        </div>
        {group.enabled && (
          <IconActionButton
            size="xs"
            variant="transparent"
            icon={<Icon iconSet="16" iconName="delete" />}
            aria-label={t("script_project.disable_entity_button.label")}
            isDisabled={isBusy}
            onPress={onToggleEnabled}
            data-testid={`sheet-group-toggle-${group.token}`}
          />
        )}
      </div>
      {!group.enabled && (
        <div className="flex flex-wrap items-center gap-2">
          <MainButton
            size="sm"
            colorScheme="secondary"
            isDisabled={isBusy}
            onPress={onToggleEnabled}
            data-testid={`sheet-group-toggle-${group.token}`}
          >
            {t("script_project.enable_entity_button.label")}
          </MainButton>
        </div>
      )}

      {hasPinnedResultOrVoiceRow && (
        <div
          className={cn(
            "grid items-stretch gap-3",
            hasPinnedResultAndVoice ? "grid-cols-2" : "grid-cols-1"
          )}
        >
          {pinnedImage && renderSheetImageCard(pinnedImage)}
          {isCharacterVoiceAvailable && (
            <CharacterVoiceCard
              token={group.token}
              voiceSignature={savedVoiceSignature}
              onOpenVoiceDialog={openVoiceDialog}
            />
          )}
        </div>
      )}

      {hasPinnedResultOrVoiceRow && <Divider className="bg-element-primary" />}

      {hasOtherVersions && (
        <>
          <Text component="h4" variant="xs" weight="semibold">
            {t("script_project.all_versions.label")}
          </Text>
          <div className="grid grid-cols-2 gap-2">
            {unpinnedImages.map(renderSheetImageCard)}
          </div>
        </>
      )}

      {hasOtherVersions && <Divider className="bg-element-primary" />}

      <div className="flex items-center gap-2">
        <Text component="h4" variant="xs" weight="semibold">
          {t("script_project.asset_creation_form.label")}
        </Text>
        {isRendering && (
          <RenderingBadge testId={`sheet-group-rendering-${group.token}`} />
        )}
      </div>

      <section
        className="flex flex-col gap-3 rounded-xl border border-element-primary bg-surface-primary p-3"
        aria-label={t("script_project.create_asset.label")}
      >
        <Text component="h4" variant="xs" weight="semibold">
          {t("script_project.create_asset.label")}
        </Text>
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
                if (isFocusMovingToDraftSavingAction(event.relatedTarget))
                  return;
                onSaveFields({
                  description: groupDescription,
                  prompt: draftPrompt
                });
              }}
              data-testid={`sheet-group-prompt-${group.token}`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              {t("script_project.generate_asset_version_button.label")}
              <RenderCostLabel
                cost={renderCost}
                isDisabled={isRerenderDisabled}
              />
            </span>
          </MainButton>
          {renderBlockedReasonKey && (
            <Text
              variant="2xs"
              color="glyph-tertiary"
              data-testid={`sheet-group-render-blocked-${group.token}`}
            >
              {t(renderBlockedReasonKey)}
            </Text>
          )}
        </div>

        <ChangedFieldsNote
          changedPaths={changedPaths}
          testId={`sheet-group-changed-${group.token}`}
        />
      </section>

      <section
        className="flex flex-col gap-3 rounded-xl border border-element-primary bg-surface-primary p-3"
        aria-label={t("script_project.upload_own_asset.label")}
      >
        <Text component="h4" variant="xs" weight="semibold">
          {t("script_project.upload_own_asset.label")}
        </Text>
        <AddImageDropTile
          onFileChosen={onUploadImage}
          isBusy={isBusyWithAnythingButImageUploads || !group.enabled}
          isUploadingImage={isUploadingImage}
          className="min-h-40 w-full"
          testId={`sheet-group-drop-${group.token}`}
        />
      </section>

      {isCharacterVoiceAvailable && (
        <OverlayDialog
          isOpen={isVoiceDialogOpen}
          onOpenChange={setIsVoiceDialogOpen}
          size={{ mode: "hug", maxWidthPx: VOICE_DIALOG_MAX_WIDTH_PX }}
          className="overflow-y-auto scrollbar-custom"
        >
          <div
            className="relative flex w-[720px] max-w-full flex-col gap-3 p-6"
            data-testid={`sheet-group-voice-dialog-${group.token}`}
          >
            <div className="absolute right-4 top-4 z-10">
              <CloseButton onPress={() => setIsVoiceDialogOpen(false)} />
            </div>
            <div className="flex flex-col gap-1 pr-10">
              <Text component="h4" variant="lg" weight="semibold">
                {t("script_project.voice.eleven_labs_library.title")}
              </Text>
              <Text variant="sm" color="glyph-secondary">
                {group.name}
              </Text>
            </div>
            <ElevenLabsVoiceLibrary
              isDisabled={isBusy || !group.enabled || isRunActive}
              selectedVoiceId={draftVoiceSignature?.voice_id ?? null}
              onSelectStockVoice={chooseDraftStockVoice}
            />
            <div className="flex pb-2">
              <MainButton
                size="md"
                colorScheme="primary"
                isDisabled={!draftVoiceSignature}
                onPress={saveDraftVoiceSignature}
                data-testid={`sheet-group-save-voice-${group.token}`}
              >
                {t("script_project.voice.save_voice_button.label")}
              </MainButton>
            </div>
          </div>
        </OverlayDialog>
      )}
    </div>
  );
};
