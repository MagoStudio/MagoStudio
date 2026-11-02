import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { useCreateShotFromRender } from "@domains/shot/useCreateShotFromRender";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { AssetStatus } from "@schemas/asset";
import { Layer } from "@schemas/layer";
import { useTranslation } from "react-i18next";

import { useDownloadImageToVideoRender } from "../hooks/useDownloadImageToVideoRender";
import { useImageToVideoReuseRenderSettings } from "../hooks/useImageToVideoReuseRenderSettings";
import { canDownloadRenderVideo } from "../utils/canDownloadRenderVideo";
import { canPromoteRenderToShot } from "../utils/canPromoteRenderToShot";

interface ImageToVideoRenderActionsProps {
  track: Layer;
  assetId: string | undefined;
  status: AssetStatus | undefined;
  selectedProjectId: string | undefined;
}

export const ImageToVideoRenderActions: React.FC<
  ImageToVideoRenderActionsProps
> = ({ track, assetId, status, selectedProjectId }) => {
  const { t } = useTranslation();
  const hasOutputAsset = !!assetId;
  const canPromote = canPromoteRenderToShot({ status, hasOutputAsset });
  const canDownload = canDownloadRenderVideo({ status, hasOutputAsset });
  const { createShotFromRender, isCreatingShotFromLayerId } =
    useCreateShotFromRender(selectedProjectId);
  const { reuseSettings } = useImageToVideoReuseRenderSettings(track);
  const { downloadRenderVideo, isDownloadingRenderVideo } =
    useDownloadImageToVideoRender(track, selectedProjectId);
  const isCreatingShot = isCreatingShotFromLayerId(track.id);

  const handleUseAsInputVideo = async () => {
    await createShotFromRender({
      layerId: track.id,
      layerName: track.name,
      assetId
    });
    trackingUtils.imageToVideoActions.createShotFromRender(
      track.id,
      selectedProjectId
    );
  };

  return (
    <div className="flex items-center gap-1">
      <GhostButton
        onPress={reuseSettings}
        colorScheme="white"
        className="flex-1"
      >
        {t("projectTimeline.imageToVideo.reuseSettings.label")}
      </GhostButton>
      {canPromote && (
        <GhostButton
          onPress={handleUseAsInputVideo}
          loading={isCreatingShot}
          colorScheme="white"
          className="flex-1"
        >
          {t("projectTimeline.imageToVideo.useAsInputVideo.label")}
        </GhostButton>
      )}
      {canDownload && (
        <GhostButton
          onPress={() => void downloadRenderVideo()}
          loading={isDownloadingRenderVideo}
          colorScheme="white"
          aria-label={t("actions.download.label")}
          data-testid={`image-to-video-download-${track.id}`}
          startIcon={<Icon iconSet="16" iconName="download" />}
        />
      )}
    </div>
  );
};
