import { GhostButton } from "@components/GhostButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { BulkRenderingFirstFrameUploadItem } from "@domains/bulkRendersRun/useBulkRenderingFirstFrameUpload";
import { Heading } from "react-aria-components/Dialog";
import { useTranslation } from "react-i18next";

import { BulkRenderingFirstFrameUploadRow } from "./BulkRenderingFirstFrameUploadRow";

const TERMINAL_STATUS_KINDS = new Set([
  "linked",
  "unlinkedToAnyShot",
  "uploadFailed"
]);

export function BulkRenderingFirstFrameUploadModal({
  items,
  onDismissItem,
  onCancelAll,
  onClose
}: {
  items: BulkRenderingFirstFrameUploadItem[];
  onDismissItem: (itemId: string) => void;
  onCancelAll: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  const isEverySettled = items.every((item) =>
    TERMINAL_STATUS_KINDS.has(item.status.kind)
  );
  const uploadedCount = items.filter(
    (item) =>
      item.status.kind === "linked" || item.status.kind === "unlinkedToAnyShot"
  ).length;
  const errorCount = items.filter(
    (item) => item.status.kind === "uploadFailed"
  ).length;

  return (
    <OverlayDialog
      isOpen
      isDismissableByOutsideClick={false}
      onOpenChange={onClose}
      size={{ mode: "hug", maxWidthPx: 735 }}
      className="backdrop-blur-[50px]"
    >
      <div className="flex w-[695px] flex-col items-start gap-4 py-8 pl-5">
        <div className="flex w-full flex-col items-start justify-center gap-2 pr-5">
          <div className="flex w-full flex-col items-start gap-1">
            <div className="flex w-full items-start justify-between">
              <Heading slot="title" className="contents">
                <Text
                  component="p"
                  variant="md"
                  weight="bold"
                  color="glyph-primary"
                >
                  {t("bulk_rendering.first_frame_upload_modal_title.label", {
                    count: items.length
                  })}
                </Text>
              </Heading>
              {isEverySettled && (
                <GhostButton colorScheme="white" onPress={onClose}>
                  {t(
                    "bulk_rendering.first_frame_upload_modal_close_button.label"
                  )}
                </GhostButton>
              )}
            </div>
            <Text
              component="p"
              variant="2xs"
              color="glyph-primary"
              className="w-full"
            >
              {t("bulk_rendering.first_frame_upload_modal_description.label", {
                uploadedCount,
                count: items.length,
                errorCount
              })}
            </Text>
          </div>
          {!isEverySettled && (
            <GhostButton onPress={onCancelAll}>
              {t(
                "bulk_rendering.first_frame_upload_modal_cancel_all_button.label"
              )}
            </GhostButton>
          )}
        </div>

        <div className="scrollbar-custom flex max-h-[400px] w-full flex-col items-start overflow-y-auto">
          {items.map((item) => (
            <BulkRenderingFirstFrameUploadRow
              key={item.id}
              item={item}
              onDismiss={onDismissItem}
            />
          ))}
        </div>
      </div>
    </OverlayDialog>
  );
}
