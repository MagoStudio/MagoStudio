import { Dropdown } from "@components/Dropdown";
import { Input } from "@components/Input";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { normaliseSheetToken } from "@domains/scriptProject/utils/normaliseSheetToken";
import { pickFirstUnusedSheetGroupName } from "@domains/scriptProject/utils/pickFirstUnusedSheetGroupName";
import { SheetKind } from "@schemas/scriptProject";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AddImageDropTile } from "./AddImageDropTile";
import {
  getSheetGroupReferenceLimit,
  SheetGroupReferences
} from "./SheetGroupReferences";
import { SheetGroupDraft } from "./utils/sheetGroupDraft";

const SHEET_KIND_LABEL_KEY: Record<SheetKind, string> = {
  character: "script_project.section_character.label",
  environment: "script_project.section_environment.label",
  prop: "script_project.section_prop.label"
};

const SHEET_KIND_DEFAULT_NAME_KEY: Record<SheetKind, string> = {
  character: "script_project.new_entity_default_name.character",
  environment: "script_project.new_entity_default_name.environment",
  prop: "script_project.new_entity_default_name.prop"
};

const SHEET_KINDS: SheetKind[] = ["character", "environment", "prop"];

type NewSheetGroup = {
  token: string;
  name: string;
  kind: SheetKind;
};

type Props = {
  draft: SheetGroupDraft;
  existingTokens: string[];
  isBusy: boolean;
  isBusyWithAnythingButImageUploads: boolean;
  onChange: React.Dispatch<React.SetStateAction<SheetGroupDraft | null>>;
  onRender: (
    newSheetGroup: NewSheetGroup &
      Pick<
        SheetGroupDraft,
        "prompt" | "referenceAssetIds" | "referenceInstruction"
      >
  ) => void;
  onUploadImage: (newSheetGroup: NewSheetGroup, file: File) => void;
  onUploadReference: (file: File) => Promise<string | undefined>;
};

export const DraftSheetGroupCard: React.FC<Props> = ({
  draft,
  existingTokens,
  isBusy,
  isBusyWithAnythingButImageUploads,
  onChange,
  onRender,
  onUploadImage,
  onUploadReference
}) => {
  const { t } = useTranslation();
  const [isUploadingReference, setIsUploadingReference] = useState(false);
  const defaultEntityName = pickFirstUnusedSheetGroupName(
    t(SHEET_KIND_DEFAULT_NAME_KEY[draft.kind]),
    existingTokens
  );
  const entityName = draft.name.trim() || defaultEntityName;
  const token = normaliseSheetToken(entityName);
  const isTokenTaken = !!token && existingTokens.includes(token);
  const usableToken = token && !isTokenTaken ? token : null;
  const hasPrompt = draft.prompt.trim().length > 0;
  const isRenderDisabled =
    isBusy || isUploadingReference || !usableToken || !hasPrompt;
  const testIdSuffix = draft.draftId;

  return (
    <div
      data-testid={`draft-sheet-group-${testIdSuffix}`}
      className="flex flex-col gap-3"
    >
      <div className="flex items-start gap-2">
        <div className="flex w-40 shrink-0 flex-col gap-1">
          <Text variant="xs" color="glyph-secondary">
            {t("script_project.add_entity_kind_input.label")}
          </Text>
          <Dropdown
            aria-label={t("script_project.add_entity_kind_input.label")}
            selectedKey={draft.kind}
            items={SHEET_KINDS.map((sheetKind) => ({
              key: sheetKind,
              label: t(SHEET_KIND_LABEL_KEY[sheetKind])
            }))}
            onSelectionChange={(key) =>
              onChange({
                ...draft,
                kind:
                  SHEET_KINDS.find((sheetKind) => sheetKind === key) ??
                  draft.kind
              })
            }
            data-testid={`draft-sheet-group-kind-${testIdSuffix}`}
          />
        </div>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <Text variant="xs" color="glyph-secondary">
            {t("script_project.add_entity_name_input.label")}
          </Text>
          <Input
            value={draft.name}
            placeholder={defaultEntityName}
            onChange={(event) =>
              onChange({ ...draft, name: event.target.value })
            }
            data-testid={`draft-sheet-group-name-${testIdSuffix}`}
          />
          {isTokenTaken && (
            <Text variant="2xs" color="glyph-error">
              {t("script_project.add_entity_token_taken.label")}
            </Text>
          )}
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Text variant="sm" weight="medium">
            {t("script_project.add_entity_way.generate")}
          </Text>
          <div className="flex flex-col rounded-lg bg-surface-primary">
            <SheetGroupReferences
              token={testIdSuffix}
              limit={getSheetGroupReferenceLimit()}
              assetIds={draft.referenceAssetIds}
              instruction={draft.referenceInstruction}
              isDisabled={isBusy}
              onChange={(referenceAssetIds, referenceInstruction) =>
                onChange((currentDraft) =>
                  currentDraft?.draftId === draft.draftId
                    ? {
                        ...currentDraft,
                        referenceAssetIds,
                        referenceInstruction
                      }
                    : currentDraft
                )
              }
              onCommit={() => undefined}
              onUpload={async (file) => {
                setIsUploadingReference(true);
                try {
                  return await onUploadReference(file);
                } finally {
                  setIsUploadingReference(false);
                }
              }}
            />
            <div className="flex flex-col gap-1.5 px-3 pb-3">
              <Text variant="xs" color="glyph-secondary">
                {t("script_project.entity_prompt_input.label")}
              </Text>
              <Textarea
                className="min-h-16"
                autoResize
                resize="vertical"
                value={draft.prompt}
                onChange={(event) =>
                  onChange({ ...draft, prompt: event.target.value })
                }
                data-testid={`draft-sheet-group-prompt-${testIdSuffix}`}
              />
              <MainButton
                size="sm"
                colorScheme="primary"
                className="self-start"
                isDisabled={isRenderDisabled}
                onPress={() => {
                  if (!usableToken) return;
                  onRender({
                    token: usableToken,
                    name: entityName,
                    kind: draft.kind,
                    prompt: draft.prompt,
                    referenceAssetIds: draft.referenceAssetIds,
                    referenceInstruction: draft.referenceInstruction
                  });
                }}
                data-testid={`draft-sheet-group-render-${testIdSuffix}`}
              >
                {t("script_project.generate_entity_button.label")}
              </MainButton>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Text variant="sm" weight="medium">
            {t("script_project.add_entity_way.upload")}
          </Text>
          <Text variant="2xs" color="glyph-tertiary">
            {t("script_project.add_entity_way.upload_hint")}
          </Text>
          <AddImageDropTile
            onFileChosen={(file) => {
              if (!usableToken) return;
              onUploadImage(
                { token: usableToken, name: entityName, kind: draft.kind },
                file
              );
            }}
            isBusy={isBusyWithAnythingButImageUploads || !usableToken}
            className="h-auto w-full min-h-40 flex-1"
            testId={`draft-sheet-group-drop-${testIdSuffix}`}
          />
        </div>
      </div>
    </div>
  );
};
