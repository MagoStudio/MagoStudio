import { Popover } from "@components/Popover";
import { ProgressBar } from "@components/ProgressBar";
import { Text } from "@components/Text";
import { FileName } from "@home/components/fileUpload/FileName";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  progress: number;
  fileName: string;
  targetRef?: React.RefObject<HTMLDivElement | null>;
  showWarning?: boolean;
  fileNameKeepStart?: number;
  fileNameKeepEnd?: number;
  compact?: boolean;
}

export function UploadProgress({
  progress,
  fileName,
  targetRef,
  showWarning = false,
  fileNameKeepStart,
  fileNameKeepEnd,
  compact = false
}: Props) {
  const { t } = useTranslation();
  const popoverTriggerRef = useRef<HTMLDivElement>(null);

  if (compact) {
    return (
      <div
        ref={popoverTriggerRef}
        className="flex h-6 items-center rounded bg-element-on-image px-1.5 py-0.5 backdrop-blur-[10px]"
      >
        <Text align="center" color="glyph-warning" select="none" variant="sm">
          {`${progress}%`}
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2.5" ref={targetRef}>
      <div ref={popoverTriggerRef} className="flex items-center gap-2">
        <div className="flex justify-end w-[4ch]">
          <Text align="center" color="glyph-warning" select="none" variant="sm">
            {`${progress}%`}
          </Text>
        </div>
        <ProgressBar progress={progress} color="glyph-warning" />
      </div>
      <Popover
        triggerRef={popoverTriggerRef}
        isOpen={showWarning}
        placement="top"
        variant="warning"
      >
        {t("notifications.upload_in_progress_warning.description")}
      </Popover>
      <FileName
        fileName={fileName}
        keepStart={fileNameKeepStart}
        keepEnd={fileNameKeepEnd}
      />
    </div>
  );
}
