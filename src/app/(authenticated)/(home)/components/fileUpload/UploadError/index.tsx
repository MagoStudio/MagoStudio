import { CloseButton } from "@components/CloseButton";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Message } from "@components/Message";
import { Text } from "@components/Text";
import { FileName } from "@home/components/fileUpload/FileName";
import { translateErrorMessage } from "@utils";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  fileName: string;
  uploadError?: string;
  onClearFileName: () => void;
  fileNameKeepStart?: number;
  fileNameKeepEnd?: number;
  compact?: boolean;
}

export function UploadError({
  fileName,
  uploadError,
  onClearFileName,
  fileNameKeepStart,
  fileNameKeepEnd,
  compact = false
}: Props) {
  const { t } = useTranslation();

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const triggerRef = useRef<HTMLDivElement>(null);

  if (compact) {
    return (
      <div
        className="flex items-center gap-1"
        onClick={handleContainerClick}
        data-testid="upload-error"
      >
        <div className="flex h-6 items-center gap-1 rounded bg-element-on-image py-0.5 pl-1.5 pr-1 backdrop-blur-[10px]">
          <Text align="center" color="glyph-error" select="none" variant="sm">
            {t("status.error.label")}
          </Text>
          <div ref={triggerRef} className="inline-flex items-center">
            <Icon
              iconSet="16-filled"
              iconName="info"
              className="text-glyph-error"
            />
          </div>
          <Message variant="error" anchorRef={triggerRef} placement="top">
            {translateErrorMessage(uploadError, t) || t("status.error.label")}
          </Message>
        </div>
        <IconActionButton
          variant="transparent"
          size="sm"
          icon={<Icon iconSet="16" iconName="cross" />}
          aria-label={t("actions.close.label")}
          onPress={onClearFileName}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-2.5"
      onClick={handleContainerClick}
      data-testid="upload-error"
    >
      <div className="flex items-center gap-2">
        <Text align="center" color="glyph-error" select="none" variant="sm">
          {t("status.error.label")}
        </Text>
        <div ref={triggerRef} className="inline-flex items-center">
          <Icon iconSet="24" iconName="info" className="text-severity-error" />
        </div>
        <Message variant="error" anchorRef={triggerRef} placement="top">
          {translateErrorMessage(uploadError, t) || t("status.error.label")}
        </Message>
      </div>
      {fileName && (
        <div className="flex items-center gap-0.5">
          <FileName
            fileName={fileName}
            keepStart={fileNameKeepStart}
            keepEnd={fileNameKeepEnd}
          />
          <CloseButton onPress={onClearFileName} />
        </div>
      )}
    </div>
  );
}
