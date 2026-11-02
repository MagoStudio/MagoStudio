import { DashedBorderOverlay } from "@components/DashedBorderOverlay";
import { GhostButton } from "@components/GhostButton";
import { UploadProgress } from "@home/components/fileUpload/UploadProgress";
import type { DropEvent } from "@react-types/shared";
import { cn } from "@utils";
import { ChangeEvent, useCallback, useRef, useState } from "react";
import { DropZone } from "react-aria-components/DropZone";
import { useTranslation } from "react-i18next";

import { validateImageFile } from "../helpers/validateImageFile";
import { ImageDropZone } from "../ImageDropZone";
import { UploadError } from "../UploadError";

const ERROR_PROCESSING_KEY =
  "notifications.upload_button_file_processing_error.description";
const ERROR_FILE_READ_KEY =
  "notifications.upload_button_file_read_error.description";

interface Props {
  disabled?: boolean;
  onClearError?: () => void;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  progress?: number;
  variant?: "default" | "button";
  uploadError?: string;
  label?: string;
  subtitle?: string;
  className?: string;
}

export function ImageUploadDropZone({
  disabled = false,
  onClearError,
  onUpload,
  progress,
  variant = "default",
  uploadError,
  label,
  subtitle,
  className
}: Props) {
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [localError, setLocalError] = useState<string>("");

  const handleFileError = useCallback((error: string, fileName: string) => {
    setFileName(fileName);
    setLocalError(error);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const processFile = useCallback(
    async (file: File): Promise<boolean> => {
      setFileName(file.name);
      const errorKey = await validateImageFile(file);
      if (errorKey) {
        handleFileError(t(errorKey), file.name);
        return false;
      }

      const fileList = new DataTransfer();
      fileList.items.add(file);
      const syntheticEvent = {
        target: { files: fileList.files }
      } as ChangeEvent<HTMLInputElement>;

      await onUpload(syntheticEvent);
      return true;
    },
    [handleFileError, onUpload, t]
  );

  const handleDrop = useCallback(
    async (e: DropEvent) => {
      if (disabled) return;

      setLocalError("");

      try {
        for (const item of e.items) {
          if (item.kind === "file") {
            try {
              const file = await item.getFile();
              const success = await processFile(file);
              if (success) break;
            } catch (error) {
              setLocalError(t(ERROR_FILE_READ_KEY));
              return;
            }
          }
        }
      } catch (error) {
        console.error("Drop handler error:", error);
        setLocalError(t(ERROR_PROCESSING_KEY));
      }
    },
    [disabled, processFile, t]
  );

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        setLocalError("");
        await processFile(file);
      }
    },
    [processFile]
  );

  const handleClearError = useCallback(() => {
    setFileName("");
    setLocalError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onClearError) {
      onClearError();
    }
  }, [onClearError]);

  const isUploading = progress !== undefined && progress > 0;
  const displayError = localError || uploadError || "";

  return (
    <>
      <input
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        disabled={disabled}
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />
      {variant === "button" && (
        <GhostButton
          isDisabled={disabled}
          loading={isUploading}
          onPress={handleClick}
          type="button"
          className={className}
        >
          {label || t("actions.upload_my_frame.label")}
        </GhostButton>
      )}
      {variant === "default" && (
        <DropZone
          className={cn(
            "group relative rounded-lg h-33 w-full data-drop-target:bg-glyph-success-opacity-10",
            className
          )}
          onDrop={handleDrop}
        >
          <DashedBorderOverlay cornerSize="sm" />
          <div
            className="flex flex-col items-center justify-center p-4 h-full w-full"
            onClick={displayError ? undefined : handleClick}
            style={{ cursor: disabled ? "default" : "pointer" }}
          >
            <div className="flex flex-col items-center justify-center gap-0.5">
              {displayError ? (
                <UploadError
                  fileName={fileName}
                  onClearFileName={handleClearError}
                  uploadError={displayError}
                  fileNameKeepStart={10}
                  fileNameKeepEnd={2}
                />
              ) : isUploading ? (
                <UploadProgress
                  fileName={fileName}
                  progress={progress}
                  fileNameKeepStart={10}
                  fileNameKeepEnd={2}
                />
              ) : (
                <ImageDropZone
                  disabled={disabled}
                  label={label}
                  subtitle={subtitle}
                />
              )}
            </div>
          </div>
        </DropZone>
      )}
    </>
  );
}
