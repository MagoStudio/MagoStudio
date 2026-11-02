import { fetchFileBypassingPlaybackCache } from "@app/utils/files/fetchFileBypassingPlaybackCache";
import { toDesktopCloudStorageUrl } from "@domains/asset/utils/toDesktopCloudStorageUrl";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { getTrackDuration } from "@domains/track/utils/getTrackDuration";
import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { isTrackAssetFinished } from "@domains/track/utils/isTrackAssetFinished";
import { isTrackMirroredFromCloud } from "@domains/track/utils/isTrackMirroredFromCloud";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { RENDER_MODELS } from "@models/video/constants";
import { IMAGE_SEQUENCE_EXPORT } from "@models/video/types";
import { Layer, LayerType } from "@schemas/layer";

import { isCloudAccountActive } from "@/platform/cloudAccount";
import { isLocalApp } from "@/platform/localDesktop";

import { downloadLayerVideo } from "./downloadFiles";
import { saveLayerDownloadToDisk } from "./saveLayerDownloadToDisk";
import { saveTrackVideoToDisk } from "./saveTrackVideoToDisk";
import { sanitizeDownloadFilename } from "./utils/sanitizeDownloadFilename";
import { withImageExtensionMatchingContentType } from "./utils/withImageExtensionMatchingContentType";

export const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const hasMultipleFrames = (track: Layer) => (getTrackDuration(track) || 0) > 1;

const isRenderLayer = (track: Layer) =>
  track.type.toLocaleLowerCase() === LayerType.RENDER.toLocaleLowerCase();

const hasFrames = (track: Layer) => track.clips && track.clips.length > 0;

const getTrackMagoEngine = (track: Layer): string | undefined =>
  getTrackRenderSettings(track)?.mago_engine as string | undefined;

const getModelForTrack = (track: Layer) => {
  const magoEngine = getTrackMagoEngine(track);
  return RENDER_MODELS.find((m) => m.name === magoEngine);
};

const isDownloadDisabled = (
  track: Layer,
  downloadType: "video" | "frames" | "video+frames"
): boolean => {
  const model = getModelForTrack(track);
  return model?.disableDownload?.includes(downloadType) ?? false;
};

const getTrackImageSequenceExport = (track: Layer): string | undefined => {
  const settings = getTrackRenderSettings(track);
  if (!settings) return undefined;

  if ("convert_exrs_to_pngs" in settings) {
    return settings.convert_exrs_to_pngs === false
      ? IMAGE_SEQUENCE_EXPORT.EXR_16BIT
      : IMAGE_SEQUENCE_EXPORT.PNG;
  }

  return settings.image_sequence_export as string | undefined;
};

export const isEXRRender = (track: Layer): boolean => {
  return getTrackImageSequenceExport(track) === IMAGE_SEQUENCE_EXPORT.EXR_16BIT;
};

const isTrackDownloadableFromCloud = (track: Layer): boolean =>
  isCloudAccountActive() && isTrackMirroredFromCloud(track);

export const isEXRDownloadable = (track: Layer): boolean => {
  if (!isTrackDownloadableFromCloud(track)) return false;
  return (
    isRenderLayer(track) && isTrackAssetFinished(track) && isEXRRender(track)
  );
};

export const areFramesDownloadable = (track: Layer) => {
  if (!isTrackDownloadableFromCloud(track)) return false;
  if (isDownloadDisabled(track, "frames")) return false;
  if (isEXRRender(track)) return false;
  return (
    isRenderLayer(track) && hasFrames(track) && isTrackAssetFinished(track)
  );
};

export const areVideoAndFramesDownloadable = (track: Layer) => {
  if (!isTrackDownloadableFromCloud(track)) return false;
  if (isDownloadDisabled(track, "video+frames")) return false;
  if (isEXRRender(track)) return false;
  const isFinished = isTrackAssetFinished(track);
  const multipleFrames = hasMultipleFrames(track);
  return isFinished && multipleFrames;
};

export const isVideoDownloadable = (track: Layer) => {
  if (isDownloadDisabled(track, "video")) return false;
  const isFinished = isTrackAssetFinished(track);
  const multipleFrames = hasMultipleFrames(track);
  return isFinished && multipleFrames;
};

export const handleDownloadFrames = async ({
  track,
  trigger,
  setIsDownloading,
  onError
}: {
  track: Layer;
  trigger: "track_download_icon" | "track_three_dots_dropdown";
  setIsDownloading: (value: boolean) => void;
  onError?: (error: unknown) => void;
}) => {
  if (isRenderLayer(track) && hasFrames(track)) {
    try {
      setIsDownloading(true);
      await saveLayerDownloadToDisk({
        layerId: track.id,
        kind: "frames",
        suggestedName: `${sanitizeDownloadFilename(track.name)}_frames.zip`
      });
    } catch (error) {
      console.error("Error downloading frames:", error);
      onError?.(error);
    } finally {
      trackingUtils.exportActions.exportMedias({
        trackId: track.id,
        assetId: getTrackAssetId(track) ?? "",
        trackOrder: track.layer_order,
        trigger,
        exportType: "frames"
      });

      setIsDownloading(false);
    }
  }
};

export const handleDownloadVideoAndFramesZip = async ({
  track,
  setIsDownloading,
  onError
}: {
  track: Layer;
  setIsDownloading: (value: boolean) => void;
  onError?: (error: unknown) => void;
}) => {
  if (!isVideoDownloadable(track)) {
    return;
  }

  try {
    setIsDownloading(true);
    await saveLayerDownloadToDisk({
      layerId: track.id,
      kind: "assets",
      suggestedName: `${sanitizeDownloadFilename(track.name)}_video.zip`
    });
  } catch (error) {
    console.error("Error downloading video:", error);
    onError?.(error);
  } finally {
    trackingUtils.exportActions.exportMedias({
      trackId: track.id,
      assetId: getTrackAssetId(track) ?? "",
      trackOrder: track.layer_order,
      trigger: "track_three_dots_dropdown",
      exportType: "frames_and_video"
    });

    setIsDownloading(false);
  }
};

export const handleDownloadVideo = async ({
  projectName,
  track,
  trigger,
  setIsDownloading,
  onError
}: {
  projectName: string;
  track: Layer;
  trigger: "track_download_icon" | "track_three_dots_dropdown";
  setIsDownloading: (value: boolean) => void;
  onError?: (error: unknown) => void;
}) => {
  if (!isVideoDownloadable(track)) {
    return;
  }

  try {
    setIsDownloading(true);
    const fileName = `${sanitizeDownloadFilename(projectName)}_${sanitizeDownloadFilename(track.name)}.mp4`;
    if (isLocalApp) {
      await saveTrackVideoToDisk({ track, fileName });
    } else {
      const blob = await downloadLayerVideo({ layerId: track.id });
      triggerBlobDownload(blob, fileName);
    }
  } catch (error) {
    console.error("Error downloading video:", error);
    onError?.(error);
  } finally {
    trackingUtils.exportActions.exportMedias({
      trackId: track.id,
      assetId: getTrackAssetId(track) ?? "",
      trackOrder: track.layer_order,
      trigger,
      exportType: "video"
    });

    setIsDownloading(false);
  }
};

export const handleDownloadEXR = async ({
  track,
  setIsDownloading,
  onError
}: {
  track: Layer;
  setIsDownloading: (value: boolean) => void;
  onError?: (error: unknown) => void;
}) => {
  if (!isEXRDownloadable(track)) {
    return;
  }

  try {
    setIsDownloading(true);
    await saveLayerDownloadToDisk({
      layerId: track.id,
      kind: "exr",
      suggestedName: `${sanitizeDownloadFilename(track.name)}_exr.zip`
    });
  } catch (error) {
    console.error("Error downloading EXR:", error);
    onError?.(error);
  } finally {
    trackingUtils.exportActions.exportMedias({
      trackId: track.id,
      assetId: getTrackAssetId(track) ?? "",
      trackOrder: track.layer_order,
      trigger: "track_three_dots_dropdown",
      exportType: "exr"
    });

    setIsDownloading(false);
  }
};

export const downloadFile = async (url: string, filename: string) => {
  const readableUrl = toDesktopCloudStorageUrl(url);
  try {
    const response = await fetchFileBypassingPlaybackCache(readableUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();

    triggerBlobDownload(
      blob,
      withImageExtensionMatchingContentType(filename, blob.type)
    );
  } catch (error) {
    console.error("Error downloading file:", error);
    const link = document.createElement("a");
    link.href = readableUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
