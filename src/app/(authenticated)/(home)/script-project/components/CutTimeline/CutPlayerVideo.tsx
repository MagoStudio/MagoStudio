import { CircularProgress } from "@components/CircularProgress";
import { DOWNLOAD_PRIORITY } from "@domains/asset/mediaDownloads";
import { useAssetDownloadState } from "@domains/asset/useAssetDownloadPriority";
import { useCachedVideoPreview } from "@domains/asset/useCachedVideoPreview";
import { CutTimelineClip } from "@domains/scriptProject/utils/buildCutTimelineClips";
import { SHOT_FPS } from "@domains/scriptProject/utils/snapShotFrames";
import { cn } from "@utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  clip: CutTimelineClip;
  isActive: boolean;
  isClipPlaying: boolean;
  onPlay: (playedVersionAssetId: string | null) => void;
  onEnded: () => void;
  onError: () => void;
  registerElement: (element: HTMLVideoElement | null) => void;
};

export const CutPlayerVideo: React.FC<Props> = ({
  clip,
  isActive,
  isClipPlaying,
  onPlay,
  onEnded,
  onError,
  registerElement
}) => {
  const { t } = useTranslation();
  const downloadState = useAssetDownloadState(clip.assetId);
  const isDownloading =
    downloadState === "queued" || downloadState === "downloading";
  const { playableVideoUrl } = useCachedVideoPreview({
    assetId: clip.assetId,
    videoUrl: clip.videoUrl,
    fps: SHOT_FPS,
    enabled: clip.isClipPlayable,
    priority: isActive ? DOWNLOAD_PRIORITY.playback : DOWNLOAD_PRIORITY.project
  });

  const [pinnedSource, setPinnedSource] = useState({
    videoUrl: playableVideoUrl,
    assetId: clip.assetId,
    versionAssetId: clip.versionAssetId
  });
  const isPinnedSourceAnOlderTake = pinnedSource.assetId !== clip.assetId;
  const isPinnedSourceAwaitingCachedCopy =
    !pinnedSource.videoUrl && !!playableVideoUrl;
  if (
    (isPinnedSourceAnOlderTake && !isClipPlaying) ||
    isPinnedSourceAwaitingCachedCopy
  ) {
    setPinnedSource({
      videoUrl: playableVideoUrl,
      assetId: clip.assetId,
      versionAssetId: clip.versionAssetId
    });
  }
  if (!pinnedSource.videoUrl) {
    return isActive && !isDownloading ? (
      <CircularProgress aria-label={t("status.loading_video.label")} />
    ) : null;
  }

  return (
    <video
      ref={registerElement}
      src={pinnedSource.videoUrl}
      preload="auto"
      playsInline
      onPlay={() => onPlay(pinnedSource.versionAssetId)}
      onEnded={onEnded}
      onError={onError}
      className={cn(
        "absolute inset-0 h-full w-full object-contain",
        isActive ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      data-testid={`cut-player-video-${clip.sequenceId}`}
    />
  );
};
