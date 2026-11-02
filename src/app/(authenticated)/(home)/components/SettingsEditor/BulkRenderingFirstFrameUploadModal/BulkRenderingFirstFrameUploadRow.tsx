import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { ProgressBar } from "@components/ProgressBar";
import { Text } from "@components/Text";
import { BulkRenderingFirstFrameUploadItem } from "@domains/bulkRendersRun/useBulkRenderingFirstFrameUpload";
import { useTranslation } from "react-i18next";

const STATUS_PILL_CLASSNAME =
  "flex h-6 shrink-0 items-center justify-center gap-1 rounded backdrop-blur-[10px] pl-0.5 pr-1 py-0.5";

export function BulkRenderingFirstFrameUploadRow({
  item,
  onDismiss
}: {
  item: BulkRenderingFirstFrameUploadItem;
  onDismiss: (itemId: string) => void;
}) {
  const { t } = useTranslation();
  const { status } = item;

  return (
    <div className="flex w-full items-center gap-4 py-1 pl-1 pr-3">
      <Text
        component="p"
        variant="sm"
        color="glyph-primary"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        className="min-w-0 flex-1"
      >
        {item.fileName}
      </Text>

      <div className="flex shrink-0 items-center justify-end gap-1">
        {status.kind === "linked" && (
          <div className={STATUS_PILL_CLASSNAME}>
            <Text component="span" variant="2xs" color="glyph-success">
              {t("bulk_rendering.first_frame_upload_row_linked_status.label", {
                shotName: status.shotName
              })}
            </Text>
          </div>
        )}
        {status.kind === "unlinkedToAnyShot" && (
          <div className={STATUS_PILL_CLASSNAME}>
            <Text component="span" variant="2xs" color="glyph-error">
              {t("bulk_rendering.first_frame_upload_row_unlinked_status.label")}
            </Text>
          </div>
        )}
        {status.kind === "uploadFailed" && (
          <div className={STATUS_PILL_CLASSNAME}>
            <Text component="span" variant="2xs" color="glyph-error">
              {t(
                "bulk_rendering.first_frame_upload_row_upload_failed_status.label"
              )}
            </Text>
          </div>
        )}
        {status.kind === "uploading" && (
          <>
            <div className={STATUS_PILL_CLASSNAME}>
              <Text component="span" variant="2xs" color="glyph-warning">
                {status.elapsedTimeLabel}
              </Text>
            </div>
            <div className="w-20 shrink-0">
              <ProgressBar
                progress={status.progressPercent}
                color="glyph-warning"
                isFillPulsing
              />
            </div>
          </>
        )}
        {status.kind === "notStarted" && (
          <>
            <div className={STATUS_PILL_CLASSNAME}>
              <Text component="span" variant="2xs" color="glyph-tertiary">
                {t(
                  "bulk_rendering.first_frame_upload_row_not_started_status.label"
                )}
              </Text>
            </div>
            <div className="w-20 shrink-0">
              <ProgressBar progress={0} />
            </div>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-center">
        {status.kind === "linked" && (
          <div className="flex items-center justify-center p-2">
            <Icon
              iconSet="16"
              iconName="checkmark"
              className="text-glyph-success"
            />
          </div>
        )}
        {(status.kind === "unlinkedToAnyShot" ||
          status.kind === "uploadFailed") && (
          <IconActionButton
            size="sm"
            variant="transparent"
            icon={
              <Icon
                iconSet="16"
                iconName="minus"
                className="text-glyph-action-secondary"
              />
            }
            onPress={() => onDismiss(item.id)}
            aria-label={t(
              "bulk_rendering.first_frame_upload_row_dismiss_button.ariaLabel"
            )}
          />
        )}
        {(status.kind === "uploading" || status.kind === "notStarted") && (
          <IconActionButton
            size="sm"
            variant="transparent"
            icon={<Icon iconSet="16" iconName="cross" />}
            onPress={() => onDismiss(item.id)}
            aria-label={t(
              "bulk_rendering.first_frame_upload_row_cancel_button.ariaLabel"
            )}
          />
        )}
      </div>
    </div>
  );
}
