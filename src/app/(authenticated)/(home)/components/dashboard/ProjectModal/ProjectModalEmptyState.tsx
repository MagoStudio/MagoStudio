"use client";

import { DashedBorderOverlay } from "@components/DashedBorderOverlay";
import { GhostButton } from "@components/GhostButton";
import { Text } from "@components/Text";
import type { DropEvent } from "@react-types/shared";
import { DropZone } from "react-aria-components/DropZone";
import { useTranslation } from "react-i18next";

interface Props {
  onUploadVideos: () => void;
  onDropFiles: (files: File[], targetFolderId?: string) => void;
}

export const ProjectModalEmptyState: React.FC<Props> = ({
  onUploadVideos,
  onDropFiles
}) => {
  const { t } = useTranslation();

  const handleDrop = async (e: DropEvent) => {
    const files: File[] = [];
    for (const item of e.items) {
      if (item.kind === "file") {
        const file = await item.getFile();
        files.push(file);
      }
    }
    if (files.length > 0) {
      onDropFiles(files);
    }
  };

  return (
    <DropZone
      className="group relative flex flex-1 flex-col items-center justify-center rounded-[20px] data-[drop-target]:bg-glyph-success-opacity-10"
      onDrop={handleDrop}
    >
      <DashedBorderOverlay cornerSize="lg" />
      <div className="flex flex-col items-center justify-center gap-5 px-5">
        <div className="size-[120px] shrink-0">
          <img src="/cat.gif" alt="" className="size-full object-cover" />
        </div>
        <div className="flex flex-col items-center gap-5 w-[498px]">
          <div className="flex flex-col items-center gap-1 text-center w-full">
            <Text variant="md" color="glyph-secondary" weight="bold">
              {t("titles.drag_drop_files.label")}
            </Text>
            <Text variant="sm" color="glyph-secondary">
              {t("titles.drag_drop_files.description")}
            </Text>
          </div>
          <div className="flex gap-2 items-center justify-center">
            <GhostButton onPress={onUploadVideos}>
              {t("actions.bulk_import.label")}
            </GhostButton>
            <GhostButton onPress={onUploadVideos}>
              {t("actions.upload_video.label")}
            </GhostButton>
          </div>
        </div>
      </div>
    </DropZone>
  );
};
