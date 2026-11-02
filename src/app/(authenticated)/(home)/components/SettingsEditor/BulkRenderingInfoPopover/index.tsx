import { GhostButton } from "@components/GhostButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { Heading } from "react-aria-components/Dialog";
import { useTranslation } from "react-i18next";

type BulkRenderingInfoPopoverProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function BulkRenderingInfoPopover({
  isOpen,
  onOpenChange
}: BulkRenderingInfoPopoverProps) {
  const { t } = useTranslation();

  return (
    <OverlayDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size={{ mode: "fixed", widthPx: 735, heightPx: 546 }}
      className="flex flex-col gap-3 px-5 py-8"
    >
      <div className="flex items-center justify-between gap-2">
        <Heading slot="title" className="contents">
          <Text
            component="span"
            variant="md"
            weight="bold"
            color="glyph-primary"
            className="flex-1"
          >
            {t("bulk_rendering.popover_title.label")}
          </Text>
        </Heading>
        <GhostButton onPress={() => onOpenChange(false)}>
          {t("bulk_rendering.hide_button.label")}
        </GhostButton>
      </div>

      <div className="flex flex-col gap-3">
        <div className="h-[394px] w-[694px] bg-[#d9d9d9]/30" />
        <Text variant="sm" color="glyph-primary" className="w-[675px]">
          {t("bulk_rendering.video_caption.label")}
        </Text>
      </div>
    </OverlayDialog>
  );
}
