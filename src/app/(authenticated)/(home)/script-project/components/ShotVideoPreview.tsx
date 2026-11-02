import { AnimatedGradient } from "@components/AnimatedGradient";
import { AssetDownloadIndicator } from "@components/AssetDownloadIndicator";
import { CircularProgress } from "@components/CircularProgress";
import { Icon } from "@components/Icon";
import { PlayButton } from "@components/PlayButton";
import { Text } from "@components/Text";
import { DOWNLOAD_PRIORITY } from "@domains/asset/mediaDownloads";
import {
  useAssetDownloadPriority,
  useAssetDownloadState
} from "@domains/asset/useAssetDownloadPriority";
import { useCachedVideoPreview } from "@domains/asset/useCachedVideoPreview";
import { isLocalVideoUrl } from "@domains/asset/utils/isLocalVideoUrl";
import { buildAspectFitStyle } from "@domains/scriptProject/utils/buildAspectFitStyle";
import { ProjectOutputSize } from "@domains/scriptProject/utils/projectOutputSize";
import { SHOT_FPS } from "@domains/scriptProject/utils/snapShotFrames";
import { cn } from "@utils";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useIntersectionObserver } from "usehooks-ts";

import { isPressOnInnerControl } from "./utils/isPressOnInnerControl";

type Props = {
  assetId?: string | null;
  videoUrl: string | null;
  posterUrl?: string | null;
  hasRender: boolean;
  isRendering?: boolean;
  hasRenderFailed?: boolean;
  renderFailedContent?: React.ReactNode;
  outputSize: ProjectOutputSize;
  className?: string;
  testId?: string;
  onPlay?: () => void;
  lazyPlayback?: boolean;
  overlay?: React.ReactNode;
  onPressVideoArea?: () => void;
};

const PREVIEW_MAX_HEIGHT_CSS = "620px";

export const ShotVideoPreview: React.FC<Props> = ({
  assetId,
  videoUrl,
  posterUrl,
  hasRender,
  isRendering,
  hasRenderFailed = false,
  renderFailedContent,
  outputSize,
  className,
  testId,
  onPlay,
  lazyPlayback = false,
  overlay,
  onPressVideoArea
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [startedVideoUrl, setStartedVideoUrl] = useState<string | null>(null);
  const { ref: visibilityRef, isIntersecting } = useIntersectionObserver({
    rootMargin: "160px"
  });

  const hasShotRenderLanded = !isRendering;
  const downloadState = useAssetDownloadState(assetId);
  const isVideoAvailableLocally = isLocalVideoUrl(videoUrl);
  const isDownloading =
    !isVideoAvailableLocally &&
    (downloadState === "queued" || downloadState === "downloading");
  const hasRequestedPlayback = !!videoUrl && startedVideoUrl === videoUrl;
  const {
    videoFirstFrameUrl,
    playableVideoUrl,
    isLoading: isPreviewLoading,
    isVideoAvailable
  } = useCachedVideoPreview({
    assetId,
    videoUrl,
    fps: SHOT_FPS,
    enabled:
      ((isIntersecting && !lazyPlayback) || hasRequestedPlayback) &&
      hasShotRenderLanded &&
      !!videoUrl,
    loadVideo: hasRequestedPlayback,
    priority: hasRequestedPlayback
      ? DOWNLOAD_PRIORITY.playback
      : DOWNLOAD_PRIORITY.visible
  });

  const activeVideoUrl = hasRequestedPlayback
    ? (playableVideoUrl ?? (isVideoAvailableLocally ? videoUrl : null))
    : null;
  useAssetDownloadPriority(
    assetId,
    hasRequestedPlayback,
    DOWNLOAD_PRIORITY.playback
  );
  const previewImageUrl = isIntersecting
    ? (videoFirstFrameUrl ?? posterUrl ?? undefined)
    : undefined;

  const handleTogglePlayback = () => {
    const video = videoRef.current;

    if (!video) {
      if (!videoUrl) return;
      setStartedVideoUrl(videoUrl);
      return;
    }

    if (video.paused) {
      video.play().catch(() => {});
      return;
    }

    video.pause();
  };

  return (
    <div
      data-testid={testId}
      ref={visibilityRef}
      data-video-playing={isVideoPlaying || undefined}
      onClick={(event) => {
        if (!onPressVideoArea || isPressOnInnerControl(event.target)) return;
        onPressVideoArea();
      }}
      style={buildAspectFitStyle(outputSize, PREVIEW_MAX_HEIGHT_CSS)}
      className={cn(
        "group relative mx-auto flex items-center justify-center overflow-hidden rounded-lg bg-surface-primary",
        onPressVideoArea && "cursor-pointer",
        className
      )}
    >
      {activeVideoUrl ? (
        <video
          ref={videoRef}
          src={activeVideoUrl}
          poster={previewImageUrl}
          autoPlay
          playsInline
          preload="auto"
          onPlay={() => {
            setIsVideoPlaying(true);
            onPlay?.();
          }}
          onPause={() => setIsVideoPlaying(false)}
          onEnded={() => setIsVideoPlaying(false)}
          className="h-full w-full object-contain"
        />
      ) : previewImageUrl ? (
        <img
          alt=""
          src={previewImageUrl}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
        />
      ) : hasRenderFailed ? (
        renderFailedContent
      ) : isRendering ? (
        <AnimatedGradient />
      ) : isIntersecting && isDownloading ? null : isIntersecting &&
        isPreviewLoading ? (
        <CircularProgress aria-label={t("status.loading_video.label")} />
      ) : hasRender ? (
        <Icon
          iconSet="24"
          iconName="broken-image"
          className="text-glyph-tertiary"
        />
      ) : (
        <Text variant="2xs" color="glyph-tertiary">
          {t("script_project.no_render_yet.label")}
        </Text>
      )}
      {isIntersecting && !isVideoAvailable && (
        <AssetDownloadIndicator assetId={assetId} />
      )}

      {videoUrl &&
        (!isDownloading || isVideoAvailable) &&
        !(isIntersecting && isPreviewLoading && !isVideoAvailable) && (
          <PlayButton
            isPlaying={isVideoPlaying}
            onPress={handleTogglePlayback}
            aria-label={
              isVideoPlaying
                ? t("script_project.pause_shot_button.label")
                : t("script_project.play_shot_button.label")
            }
            className={cn(
              "absolute size-12 rounded-full bg-transparent text-glyph-primary-on-pic",
              "transition-opacity data-[hovered]:bg-transparent [&_svg]:size-8",
              isVideoPlaying
                ? "opacity-0 group-hover:opacity-100"
                : "opacity-100"
            )}
            data-testid={testId ? `${testId}-play` : undefined}
          />
        )}
      {overlay}
    </div>
  );
};
