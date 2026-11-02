import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { ProgressBar } from "@components/ProgressBar";
import { Text } from "@components/Text";
import type { BulkUploadFileItem, BulkUploadFileStatus } from "@store/atoms";
import type { GlyphPalette } from "@styles/types";
import { useTranslation } from "react-i18next";

const STATUS_CONFIG: Record<
  BulkUploadFileStatus,
  {
    textColor:
      | "glyph-success"
      | "glyph-warning"
      | "glyph-error"
      | "glyph-secondary";
    barColor: GlyphPalette;
    showBar: boolean;
  }
> = {
  completed: {
    textColor: "glyph-success",
    barColor: "glyph-success",
    showBar: true
  },
  uploading: {
    textColor: "glyph-warning",
    barColor: "glyph-warning",
    showBar: true
  },
  ingesting: {
    textColor: "glyph-warning",
    barColor: "glyph-warning",
    showBar: true
  },
  error: {
    textColor: "glyph-error",
    barColor: "glyph-error",
    showBar: true
  },
  pending: {
    textColor: "glyph-secondary",
    barColor: "glyph-secondary",
    showBar: true
  },
  validating: {
    textColor: "glyph-secondary",
    barColor: "glyph-secondary",
    showBar: true
  },
  cancelled: {
    textColor: "glyph-secondary",
    barColor: "glyph-secondary",
    showBar: true
  }
};

const getStatusLabel = (
  file: BulkUploadFileItem,
  t: (key: string) => string,
  isActive: boolean
): string => {
  switch (file.status) {
    case "completed":
      return t("bulk_upload.done.label");
    case "uploading":
    case "ingesting":
      return t("bulk_upload.uploading_status.label");
    case "error":
      return isActive
        ? t("bulk_upload.error.label")
        : file.errorMessage || t("bulk_upload.error.label");
    case "cancelled":
      return t("bulk_upload.cancelled.label");
    default:
      return t("bulk_upload.not_started.label");
  }
};

const isCancellable = (status: BulkUploadFileStatus) =>
  status === "pending" ||
  status === "validating" ||
  status === "uploading" ||
  status === "ingesting";

interface Props {
  file: BulkUploadFileItem;
  onCancel: (fileId: string) => void;
  isActive: boolean;
}

export const BulkUploadFileRow: React.FC<Props> = ({
  file,
  onCancel,
  isActive
}) => {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[file.status];

  return (
    <div className="flex items-center gap-2 py-2">
      <Text
        variant="sm"
        color="glyph-primary"
        className="min-w-0 flex-1 truncate"
      >
        {file.fileName}
      </Text>

      <Text variant="2xs" color={config.textColor} className="shrink-0">
        {getStatusLabel(file, t, isActive)}
      </Text>
      {file.status === "error" && (
        <Icon
          iconSet="16-filled"
          iconName="info"
          className="shrink-0 text-glyph-error"
        />
      )}
      {config.showBar && (
        <div className="w-[80px] shrink-0">
          <ProgressBar progress={file.progress} color={config.barColor} />
        </div>
      )}

      <div className="w-6 shrink-0 flex items-center justify-center">
        {isCancellable(file.status) && (
          <IconActionButton
            icon={<Icon iconSet="16" iconName="cross" />}
            onPress={() => onCancel(file.id)}
            aria-label="Cancel"
          />
        )}
        {file.status === "completed" && <Icon iconSet="16" iconName="folder" />}
      </div>
    </div>
  );
};
