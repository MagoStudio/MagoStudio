import { CircularProgress } from "@components/CircularProgress";
import { DashedBorderOverlay } from "@components/DashedBorderOverlay";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { PlanShotImageUpload } from "@domains/plan/usePlanShotImageAssignments";
import { truncateFileNameFixed } from "@home/components/fileUpload/helpers/truncateFileName";
import { UploadError } from "@home/components/fileUpload/UploadError";
import { Button } from "react-aria-components/Button";
import { DropZone } from "react-aria-components/DropZone";
import { FileTrigger } from "react-aria-components/FileTrigger";
import { FileDropItem } from "react-aria-components/GridList";
import { useTranslation } from "react-i18next";

const ACCEPTED_FILE_TYPES = ["image/jpg", "image/jpeg", "image/png"];
const FILENAME_MAX_LENGTH = 30;

interface Props {
  uploads: PlanShotImageUpload[];
  onUpload: (files: File[]) => void;
  onRemoveUpload: (id: string) => void;
}

export const PlanShotImageUploadZone: React.FC<Props> = ({
  uploads,
  onUpload,
  onRemoveUpload
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <DropZone
        className="group relative overflow-hidden rounded data-[drop-target]:bg-element-success/10"
        getDropOperation={(types) => {
          for (const acceptedType of ACCEPTED_FILE_TYPES) {
            if (types.has(acceptedType)) return "copy";
          }
          return "cancel";
        }}
        onDrop={async (e) => {
          const fileItems = e.items.filter(
            (item) => item.kind === "file"
          ) as FileDropItem[];
          const files = await Promise.all(
            fileItems.map((item) => item.getFile())
          );
          onUpload(files);
        }}
      >
        <DashedBorderOverlay />
        <FileTrigger
          acceptedFileTypes={ACCEPTED_FILE_TYPES}
          allowsMultiple
          onSelect={(files) => {
            if (!files) return;
            onUpload(Array.from(files));
          }}
        >
          <Button className="flex flex-col gap-0.5 justify-center items-center w-full text-glyph-tertiary p-6">
            <Icon
              iconSet="24"
              iconName="upload"
              className="text-glyph-tertiary"
            />
            <Text color="glyph-primary" variant="md">
              {t("plan.shot_images.upload_zone.label")}
            </Text>
            <Text color="glyph-tertiary" variant="sm">
              {t("plan.shot_images.upload_zone.description")}
            </Text>
          </Button>
        </FileTrigger>
      </DropZone>
      {uploads.length > 0 && (
        <div className="flex flex-col gap-1">
          {uploads.map((upload) =>
            upload.status === "error" ? (
              <div
                key={upload.id}
                className="flex items-center justify-between gap-2 px-2 py-1 bg-element-primary rounded"
              >
                <Text variant="sm" color="glyph-secondary">
                  {truncateFileNameFixed(
                    upload.fileName,
                    FILENAME_MAX_LENGTH,
                    0
                  )}
                </Text>
                <UploadError
                  compact
                  fileName={upload.fileName}
                  uploadError={
                    upload.errorKey === "upload_error"
                      ? t("plan.shot_images.upload_failed.description")
                      : t(`notifications.${upload.errorKey}.description`)
                  }
                  onClearFileName={() => onRemoveUpload(upload.id)}
                />
              </div>
            ) : (
              <div
                key={upload.id}
                className="flex items-center justify-between gap-2 px-2 py-1 bg-element-primary rounded"
              >
                <div className="flex items-center gap-2">
                  {upload.status === "uploading" ? (
                    <CircularProgress size="xs" />
                  ) : (
                    <Icon
                      iconSet="16"
                      iconName="checkmark"
                      className="text-glyph-success"
                    />
                  )}
                  <Text variant="sm" color="glyph-secondary">
                    {truncateFileNameFixed(
                      upload.fileName,
                      FILENAME_MAX_LENGTH,
                      0
                    )}
                  </Text>
                </div>
                <IconActionButton
                  aria-label={t("actions.delete.label")}
                  icon={<Icon iconSet="16" iconName="delete" />}
                  variant="dark"
                  onPress={() => onRemoveUpload(upload.id)}
                />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
