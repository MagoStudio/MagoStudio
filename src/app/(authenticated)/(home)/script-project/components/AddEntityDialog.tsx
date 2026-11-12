import { CloseButton } from "@components/CloseButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import { DraftSheetGroupCard } from "./DraftSheetGroupCard";

const DIALOG_MAX_WIDTH_PX = 600;
const DIALOG_VIEWPORT_MARGIN_PX = 32;

type Props = React.ComponentProps<typeof DraftSheetGroupCard> & {
  onDiscard: () => void;
};

export const AddEntityDialog: React.FC<Props> = ({
  onDiscard,
  ...draftCardProps
}) => {
  const { t } = useTranslation();

  return (
    <OverlayDialog
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onDiscard();
      }}
      size={{
        mode: "hug",
        maxWidthPx: DIALOG_MAX_WIDTH_PX,
        viewportMarginPx: DIALOG_VIEWPORT_MARGIN_PX
      }}
    >
      <div
        className="relative flex w-150 max-w-full flex-col gap-4 overflow-y-auto p-6 scrollbar-custom"
        style={{
          maxHeight: `calc(100vh - ${DIALOG_VIEWPORT_MARGIN_PX * 2}px)`
        }}
        data-testid="add-entity-dialog"
      >
        <div className="absolute right-4 top-4">
          <CloseButton onPress={onDiscard} />
        </div>

        <div className="flex flex-col gap-1">
          <Text component="h4" variant="lg" weight="semibold">
            {t("script_project.add_entity_dialog_title.label")}
          </Text>
          <Text variant="2xs" color="glyph-tertiary">
            {t("script_project.draft_entity_hint.label")}
          </Text>
        </div>

        <DraftSheetGroupCard {...draftCardProps} />
      </div>
    </OverlayDialog>
  );
};
