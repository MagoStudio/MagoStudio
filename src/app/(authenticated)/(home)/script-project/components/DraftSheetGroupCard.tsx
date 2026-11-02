import { Dropdown } from "@components/Dropdown";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Input } from "@components/Input";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { normaliseSheetToken } from "@domains/scriptProject/utils/normaliseSheetToken";
import { pickFirstUnusedSheetGroupName } from "@domains/scriptProject/utils/pickFirstUnusedSheetGroupName";
import { SheetKind } from "@schemas/scriptProject";
import { useTranslation } from "react-i18next";

import { AddImageDropTile } from "./AddImageDropTile";
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
  onChange: (draft: SheetGroupDraft) => void;
  onRender: (newSheetGroup: NewSheetGroup & { prompt: string }) => void;
  onUploadImage: (newSheetGroup: NewSheetGroup, file: File) => void;
  onDiscard: () => void;
};

export const DraftSheetGroupCard: React.FC<Props> = ({
  draft,
  existingTokens,
  isBusy,
  onChange,
  onRender,
  onUploadImage,
  onDiscard
}) => {
  const { t } = useTranslation();
  const defaultEntityName = pickFirstUnusedSheetGroupName(
    t(SHEET_KIND_DEFAULT_NAME_KEY[draft.kind]),
    existingTokens
  );
  const entityName = draft.name.trim() || defaultEntityName;
  const token = normaliseSheetToken(entityName);
  const isTokenTaken = !!token && existingTokens.includes(token);
  const usableToken = token && !isTokenTaken ? token : null;
  const hasPrompt = draft.prompt.trim().length > 0;
  const isRenderDisabled = isBusy || !usableToken || !hasPrompt;
  const testIdSuffix = draft.draftId;

  return (
    <div
      data-testid={`draft-sheet-group-${testIdSuffix}`}
      className="flex flex-col gap-3 rounded-2xl border border-element-primary bg-surface-secondary p-4"
    >
      <div className="flex items-start gap-2">
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
          {token && (
            <Text variant="2xs" color="glyph-tertiary">
              {token}
            </Text>
          )}
          {isTokenTaken && (
            <Text variant="2xs" color="glyph-error">
              {t("script_project.add_entity_token_taken.label")}
            </Text>
          )}
        </label>
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
        <IconActionButton
          variant="transparent"
          size="sm"
          icon={<Icon iconSet="16" iconName="delete" />}
          aria-label={t("script_project.discard_draft_entity_button.ariaLabel")}
          onPress={onDiscard}
          data-testid={`draft-sheet-group-discard-${testIdSuffix}`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
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
        <Text variant="2xs" color="glyph-tertiary">
          {t("script_project.draft_entity_hint.label")}
        </Text>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <AddImageDropTile
          onFileChosen={(file) => {
            if (!usableToken) return;
            onUploadImage(
              { token: usableToken, name: entityName, kind: draft.kind },
              file
            );
          }}
          isBusy={isBusy || !usableToken}
          className="h-auto w-48 min-h-40"
          testId={`draft-sheet-group-drop-${testIdSuffix}`}
        />
        <MainButton
          size="sm"
          colorScheme="primary"
          isDisabled={isRenderDisabled}
          onPress={() => {
            if (!usableToken) return;
            onRender({
              token: usableToken,
              name: entityName,
              kind: draft.kind,
              prompt: draft.prompt
            });
          }}
          data-testid={`draft-sheet-group-render-${testIdSuffix}`}
        >
          {t("script_project.render_button.label")}
        </MainButton>
      </div>
    </div>
  );
};
