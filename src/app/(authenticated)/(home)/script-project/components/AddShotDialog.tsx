import { CloseButton } from "@components/CloseButton";
import { Input } from "@components/Input";
import { MainButton } from "@components/MainButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { Textarea } from "@components/Textarea";
import { SHOT_HEADING_MAX_LENGTH } from "@domains/scriptProject/constants";
import { buildDraftShotReferenceChips } from "@domains/scriptProject/utils/buildDraftShotReferenceChips";
import { SheetImageUrls } from "@domains/scriptProject/utils/buildSheetImageUrlIndex";
import { fillMissingShotName } from "@domains/scriptProject/utils/fillMissingShotName";
import { parseShotDialogue } from "@domains/scriptProject/utils/shotDialogueText";
import {
  getTagCategoryForSheetKind,
  withShotTagAdded,
  withShotTagRemoved
} from "@domains/scriptProject/utils/shotTagCategories";
import { SheetGroup, ShotDialogueTurn, ShotTags } from "@schemas/scriptProject";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ShotAddReferenceControl } from "./ShotAddReferenceControl";
import { ShotReferenceList } from "./ShotReferenceList";

const DIALOG_WIDTH_PX = 600;
const DIALOG_HEIGHT_PX = 700;
const NO_TAGS: ShotTags = { characters: [], environments: [], props: [] };

type Props = {
  suggestedHeading: string;
  shotIndex: number | null;
  sheetGroups: SheetGroup[];
  imageUrlsByAssetId: Map<string, SheetImageUrls>;
  isBusy: boolean;
  onClose: () => void;
  onAdd: (shot: {
    heading: string | null;
    videoPrompt: string;
    dialogue: ShotDialogueTurn[];
    tags: ShotTags;
    shotIndex: number | null;
  }) => void;
};

export const AddShotDialog: React.FC<Props> = ({
  suggestedHeading,
  shotIndex,
  sheetGroups,
  imageUrlsByAssetId,
  isBusy,
  onClose,
  onAdd
}) => {
  const { t } = useTranslation();
  const [heading, setHeading] = useState(suggestedHeading);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [dialogueText, setDialogueText] = useState("");
  const [tags, setTags] = useState<ShotTags>(NO_TAGS);

  const trimmedVideoPrompt = videoPrompt.trim();
  const canAdd = trimmedVideoPrompt.length > 0 && !isBusy;
  const chips = buildDraftShotReferenceChips(tags, sheetGroups);

  return (
    <OverlayDialog
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      size={{
        mode: "fixed",
        widthPx: DIALOG_WIDTH_PX,
        heightPx: DIALOG_HEIGHT_PX
      }}
    >
      <div
        className="relative flex h-full w-full flex-col gap-4 overflow-y-auto p-6 scrollbar-custom"
        data-testid="add-shot-dialog"
      >
        <div className="absolute right-4 top-4">
          <CloseButton onPress={onClose} />
        </div>

        <Text component="h4" variant="lg" weight="semibold">
          {t("script_project.add_shot_dialog_title.label")}
        </Text>

        <label className="flex flex-col gap-1">
          <Text variant="xs" color="glyph-secondary">
            {t("script_project.add_shot_name_input.label")}
          </Text>
          <Input
            value={heading}
            maxLength={SHOT_HEADING_MAX_LENGTH}
            placeholder={t("script_project.add_shot_name_input.placeholder")}
            onChange={(event) => setHeading(event.target.value)}
            data-testid="add-shot-name"
          />
        </label>

        <div className="flex flex-col gap-1">
          <Text variant="xs" color="glyph-secondary">
            {t("script_project.shot_prompt_input.label")}
          </Text>
          <Textarea
            className="min-h-24"
            value={videoPrompt}
            onChange={(event) => setVideoPrompt(event.target.value)}
            data-testid="add-shot-prompt"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Text variant="xs" color="glyph-secondary">
            {t("script_project.add_shot_assets_input.label")}
          </Text>
          <div className="grid grid-cols-3 gap-2">
            <ShotReferenceList
              voicedCharacterTokens={new Set()}
              chips={chips}
              imageUrlsByAssetId={imageUrlsByAssetId}
              isBusy={isBusy}
              onRemoveReference={(chip) =>
                setTags(withShotTagRemoved(tags, chip.category, chip.token))
              }
            />
            <ShotAddReferenceControl
              sheetGroups={sheetGroups}
              taggedTokens={chips.map((chip) => chip.token)}
              isBusy={isBusy}
              onAddReference={(group) => {
                const category = getTagCategoryForSheetKind(group.kind);
                if (!category) return;
                setTags(withShotTagAdded(tags, category, group.token));
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Text variant="xs" color="glyph-secondary">
            {t("script_project.shot_dialogue_input.label")}
          </Text>
          <Textarea
            className="min-h-16"
            value={dialogueText}
            placeholder={t("script_project.shot_dialogue_input.placeholder")}
            onChange={(event) => setDialogueText(event.target.value)}
            data-testid="add-shot-dialogue"
          />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <Text variant="2xs" color="glyph-tertiary">
            {t("script_project.add_shot_hint.label")}
          </Text>
          <MainButton
            colorScheme="primary"
            isDisabled={!canAdd}
            loading={isBusy}
            onPress={() =>
              onAdd({
                heading: fillMissingShotName(
                  heading,
                  t("script_project.add_shot_name_input.placeholder")
                ),
                videoPrompt: trimmedVideoPrompt,
                dialogue: parseShotDialogue(dialogueText, []),
                tags,
                shotIndex
              })
            }
            data-testid="add-shot-submit"
          >
            {t("script_project.add_shot_submit_button.label")}
          </MainButton>
        </div>
      </div>
    </OverlayDialog>
  );
};
