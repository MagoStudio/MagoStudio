/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { DOWNLOAD_PRIORITY } from "@domains/asset/mediaDownloads";
import { useCachedVideoUrl } from "@domains/asset/useCachedVideoUrl";
import { useVideoAsset } from "@domains/asset/useVideoAsset";
import {
  getTimelineOffset,
  toOutputFrame,
  toSeconds
} from "@domains/track/utils/frameCoordinates";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { useGlobalPlayableFrameRange } from "@domains/videoPlayer/useGlobalPlayableFrameRange";
import { PreviewMessage } from "@home/components/VideoPreview/PreviewMessage";
import { Layer } from "@schemas/layer";
import {
  currentVideoFrameAtom,
  currentVideoSrcAtom,
  isPlayingAtom,
  isPreviewMutedAtom,
  videoElementRefsAtom
} from "@store/atoms";
import { isFrameWithinPlayableRange } from "@utils";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VIDEO_ERROR_MESSAGES = {
  1: "Video loading was aborted",
  2: "Network error occurred while loading video",
  3: "Video decoding failed",
  4: "Video format not supported"
};

interface Props {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  selectedLayer: Layer;
  overrideVideoSrc?: string;
  variant?: "base" | "overlay";
}

export const calculateVideoTime = (
  currentFrame: number,
  clipOffset: number,
  fps: number
): number =>
  toSeconds({
    outputFrame: toOutputFrame({
      sourceFrame: currentFrame,
      offset: clipOffset
    }),
    fps
  });

export const getVideoStartTime = (
  clipOffset: number,
  globalStart: number,
  fps: number
): number => {
  const effectiveStart = Math.max(clipOffset, globalStart);
  return toSeconds({
    outputFrame: toOutputFrame({
      sourceFrame: effectiveStart,
      offset: clipOffset
    }),
    fps
  });
};

export const getVideoEndTime = (
  clipOffset: number,
  clipDuration: number,
  globalEnd: number,
  fps: number
): number => {
  const clipEnd = clipOffset + clipDuration;
  const effectiveEnd = Math.min(clipEnd, globalEnd);
  return toSeconds({
    outputFrame: toOutputFrame({
      sourceFrame: effectiveEnd,
      offset: clipOffset
    }),
    fps
  });
};

const isFrameInRange = (
  currentFrame: number,
  clipOffset: number,
  clipDuration: number
): boolean => {
  return (
    currentFrame >= clipOffset && currentFrame <= clipOffset + clipDuration
  );
};

const getErrorMessage = (errorCode: number | undefined): string => {
  if (!errorCode) return "Unknown video loading error";
  return (
    VIDEO_ERROR_MESSAGES[errorCode as keyof typeof VIDEO_ERROR_MESSAGES] ||
    "Unknown video loading error"
  );
};

export const VideoMediaPlayer: React.FC<Props> = ({
  setIsLoading,
  selectedLayer,
  overrideVideoSrc
}) => {
  const assetId = getTrackAssetId(selectedLayer);
  const videoElement = useRef<HTMLVideoElement>(null);
  const [loadFailure, setLoadFailure] = useState<{
    sourceUrl: string | undefined;
    message: string;
  } | null>(null);
  const isPlaying = useAtomValue(isPlayingAtom);
  const isMuted = useAtomValue(isPreviewMutedAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const { globalPlayableFrameRange } = useGlobalPlayableFrameRange();
  const { fps } = useFpsForShot();
  const currentVideoFrame = useAtomValue(currentVideoFrameAtom);
  const setCurrentVideoSrc = useSetAtom(currentVideoSrcAtom);
  const setVideoElementRefs = useSetAtom(videoElementRefsAtom);

  const { data: videoAsset } = useVideoAsset({
    assetId,
    priority: DOWNLOAD_PRIORITY.playback,
    selectedLayerId: selectedLayer.id
  });

  const urlToUse =
    videoAsset && "urlToUse" in videoAsset ? videoAsset.urlToUse : undefined;

  const cachedOverrideVideoSrc = useCachedVideoUrl(overrideVideoSrc);

  const videoSrc = cachedOverrideVideoSrc || urlToUse;

  useEffect(() => {
    if (!videoSrc) return;

    setCurrentVideoSrc((prev) => ({
      ...prev,
      [selectedLayer.id]: videoSrc
    }));

    setVideoElementRefs((prev) => ({
      ...prev,
      [selectedLayer.id]: videoElement.current
    }));

    return () => {
      setVideoElementRefs((prev) => {
        const updated = { ...prev };
        delete updated[selectedLayer.id];
        return updated;
      });
    };
  }, [videoSrc, selectedLayer.id, setCurrentVideoSrc, setVideoElementRefs]);

  useEffect(() => {
    videoElement.current?.load();
  }, [videoSrc]);

  useEffect(() => {
    if (videoSrc) {
      setIsPlaying(false);
    }
  }, [videoSrc, setIsPlaying]);

  const clipOffsetFrames = getTimelineOffset(selectedLayer);

  const clipDurationFrames = useMemo(() => {
    const s3AssetDuration =
      videoAsset && "asset" in videoAsset ? videoAsset.asset.data?.duration : 0;
    return s3AssetDuration || getTrackClip(selectedLayer)?.data?.duration || 0;
  }, [selectedLayer, videoAsset]);

  const isFrameInLocalRange = useMemo(() => {
    return isFrameInRange(
      currentVideoFrame,
      clipOffsetFrames,
      clipDurationFrames
    );
  }, [currentVideoFrame, clipOffsetFrames, clipDurationFrames]);

  const isCurrentFrameInRange = useMemo(() => {
    return isFrameWithinPlayableRange(
      currentVideoFrame,
      clipOffsetFrames,
      clipDurationFrames,
      globalPlayableFrameRange.start,
      globalPlayableFrameRange.end
    );
  }, [
    currentVideoFrame,
    clipOffsetFrames,
    clipDurationFrames,
    globalPlayableFrameRange.start,
    globalPlayableFrameRange.end
  ]);

  const handleLoadedData = useCallback(() => {
    if (!videoElement.current) return;
    setIsLoading(false);

    if (isFrameInLocalRange) {
      const newVideoTime = calculateVideoTime(
        currentVideoFrame,
        clipOffsetFrames,
        fps
      );
      videoElement.current.currentTime = newVideoTime;
    }
  }, [
    setIsLoading,
    currentVideoFrame,
    clipOffsetFrames,
    fps,
    isFrameInLocalRange
  ]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, [setIsLoading]);

  const handleVideoEnd = useCallback(() => {
    if (!videoElement.current || !isPlaying) {
      return;
    }

    const startTime = getVideoStartTime(
      clipOffsetFrames,
      globalPlayableFrameRange.start,
      fps
    );

    videoElement.current.currentTime = startTime;
    videoElement.current.play().catch((err) => console.error(err));
  }, [isPlaying, clipOffsetFrames, globalPlayableFrameRange.start, fps]);

  useEffect(() => {
    if (!videoElement.current) return;
    if (!isFrameInLocalRange) return;

    const newVideoTime = calculateVideoTime(
      currentVideoFrame,
      clipOffsetFrames,
      fps
    );

    const startTime = getVideoStartTime(
      clipOffsetFrames,
      globalPlayableFrameRange.start,
      fps
    );

    const endTime = getVideoEndTime(
      clipOffsetFrames,
      clipDurationFrames,
      globalPlayableFrameRange.end,
      fps
    );

    const isLoopingBack = currentVideoFrame === globalPlayableFrameRange.start;

    const hasExceededEndTime = videoElement.current?.currentTime >= endTime;

    if (
      isPlaying &&
      newVideoTime > startTime &&
      !isLoopingBack &&
      !hasExceededEndTime
    ) {
      return;
    }

    videoElement.current.currentTime = newVideoTime;
  }, [
    currentVideoFrame,
    clipOffsetFrames,
    clipDurationFrames,
    fps,
    isFrameInLocalRange,
    isPlaying,
    globalPlayableFrameRange.start,
    globalPlayableFrameRange.end
  ]);

  useEffect(() => {
    if (!videoElement.current) return;

    if (!isPlaying) {
      videoElement.current.pause();
      return;
    }

    if (!isCurrentFrameInRange) {
      videoElement.current.pause();
      return;
    }

    videoElement.current.play().catch((err) => console.error(err));
  }, [isPlaying, isCurrentFrameInRange]);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      const video = e.target as HTMLVideoElement;

      const errorMessage =
        video.error?.message || getErrorMessage(video.error?.code);

      setIsLoading(false);
      setLoadFailure({ sourceUrl: videoSrc, message: errorMessage });
    },
    [setIsLoading, videoSrc]
  );

  const loadError =
    loadFailure && loadFailure.sourceUrl === videoSrc
      ? loadFailure.message
      : null;

  if (loadError) {
    return <PreviewMessage message={loadError} variant="text" />;
  }

  if (!videoSrc) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center m-auto h-full w-full select-none">
      <video
        className={"h-full w-full object-contain"}
        muted={isMuted}
        onClick={(e) => e.preventDefault()}
        onEnded={handleVideoEnd}
        onError={handleError}
        onLoadedData={handleLoadedData}
        onLoadedMetadata={handleLoadedData}
        onLoadStart={handleLoadStart}
        playsInline
        ref={videoElement}
        src={videoSrc}
        aria-label="Video preview"
        data-layer-id={selectedLayer.id}
        data-asset-id={assetId}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
