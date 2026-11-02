import { Alert } from "@components/Alert";
import { Modal } from "@components/Modal";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useImageToVideoContainerShot } from "@domains/shot/useImageToVideoContainerShot";
import { DEFAULT_TOOL } from "@hooks/tool/parseTool";
import { useTool } from "@hooks/tool/useTool";
import { useTranslation } from "react-i18next";

import { ImageToVideoRenders } from "./ImageToVideoRenders";
import { ImageToVideoSettingsForm } from "./ImageToVideoSettingsForm";

export const ImageToVideoModal: React.FC = () => {
  const { t } = useTranslation();
  const { tool, setTool } = useTool();
  const selectedProjectId = useSelectedProjectId();
  const { containerShotId } = useImageToVideoContainerShot(selectedProjectId);
  const isOpen = tool === "image-to-video";

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={() => setTool(DEFAULT_TOOL)}
      title={t("projectTimeline.imageToVideo.modalTitle.label")}
      width="xl"
      fullHeight
      contentClassName="flex flex-col h-full"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <Alert alertVariant="warning" canClose={false}>
          {t("projectTimeline.imageToVideo.prototypeWarning.label")}
        </Alert>
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-glyph-invert-main">
          <div className="w-img2img-settings flex min-h-0 flex-shrink-0 flex-col border-r border-glyph-invert-main">
            <ImageToVideoSettingsForm selectedProjectId={selectedProjectId} />
          </div>
          <div className="min-h-0 min-w-0 flex-1">
            <ImageToVideoRenders
              selectedProjectId={selectedProjectId}
              containerShotId={containerShotId}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
