"use client";

import { Backdrop } from "@components/Backdrop";
import { CloseButton } from "@components/CloseButton";
import { Text } from "@components/Text";
import { useCreateProjectAndUploadVideo } from "@domains/shot/useCreateProjectAndUploadVideo";
import { Dialog, DialogPanel } from "@headlessui/react";
import { VideoTrimmer } from "@home/components/fileUpload/VideoUpload/VideoTrimmer";
import { TrimMetadata } from "@schemas/video";
import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

interface VideoUploadModalProps {
  videoFile: File;
  onClose: () => void;
  onUploadSuccess: (projectId: string, shotId: string) => void;
  existingProjectId?: string;
  minDurationSeconds?: number;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  videoFile,
  onClose,
  onUploadSuccess,
  existingProjectId,
  minDurationSeconds
}) => {
  const { t } = useTranslation();

  const {
    handleUpload,
    uploadProgress,
    error: uploadError,
    isUploading,
    cancelUpload
  } = useCreateProjectAndUploadVideo({
    onSuccess: onUploadSuccess,
    existingProjectId
  });

  const progress =
    uploadProgress !== undefined && uploadProgress > 0 && !uploadError
      ? uploadProgress
      : undefined;

  const handleModalClose = async () => {
    if (isUploading) {
      const confirmed = window.confirm(
        t("notifications.upload_cancel_confirm.description")
      );
      if (!confirmed) return;
      await cancelUpload();
    }
    onClose();
  };
  const handleConfirm = ({
    trimMetadata,
    processedFile
  }: {
    trimMetadata?: TrimMetadata;
    processedFile?: File;
  }) => {
    const fileList = new DataTransfer();
    fileList.items.add(videoFile);
    const syntheticEvent = {
      target: {
        files: fileList.files
      }
    } as ChangeEvent<HTMLInputElement>;

    void handleUpload({
      e: syntheticEvent,
      trimMetadata,
      processedFile
    });
  };
  return (
    <Dialog
      as="div"
      className="fixed z-modal inset-0 overflow-y-auto"
      onClose={handleModalClose}
      open
    >
      <Backdrop />
      <div className="relative w-full min-h-screen px-5 py-8 flex items-center justify-center">
        <div className="absolute top-4 right-4 z-10">
          <CloseButton onClick={handleModalClose} />
        </div>
        <DialogPanel
          className="w-[clamp(880px,calc(80vw_-_144px),1392px)] h-[calc(100vh-64px)] px-5 py-8
          rounded-[20px] border border-element-primary bg-surface-secondary-opacity-90 backdrop-blur-[50px]
          flex flex-col items-center gap-6"
        >
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-2xl font-thin text-center font-syne">
              {t("titles.trim_your_video.label")}
            </h2>
            <Text variant="sm" color="glyph-primary" align="center">
              {t("titles.video_upload_limit.label")}
            </Text>
          </div>
          <div className="flex-1 w-full min-h-0">
            <VideoTrimmer
              videoFile={videoFile}
              onConfirm={handleConfirm}
              uploadProgress={progress}
              uploadError={uploadError ?? undefined}
              onClearFile={onClose}
              minDurationSeconds={minDurationSeconds}
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
