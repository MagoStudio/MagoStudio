"use client";

/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for video element sync */

import { type TimelineShotEntry } from "@domains/project/useProjectTimelineData";
import { resolveActiveTrackForShot } from "@domains/project/utils/resolveActiveTrackForShot";
import { useEffect, useRef } from "react";

import { useShotVideoUrl } from "../hooks/useShotVideoUrl";

const PLAYBACK_START_DELAY_MS = 50;

interface ShotVideoProps {
  entry: TimelineShotEntry;
  pinnedTrackIds: Record<string, string>;
  isActive: boolean;
  isPlaying: boolean;
  localFrame: number;
  fps: number;
  onTimeUpdateRef: React.RefObject<
    (shotEntry: TimelineShotEntry, localFrame: number) => void
  >;
  onEndedRef: React.RefObject<(shotEntry: TimelineShotEntry) => void>;
}

export function ShotVideo({
  entry,
  pinnedTrackIds,
  isActive,
  isPlaying,
  localFrame,
  fps,
  onTimeUpdateRef
}: ShotVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sourceVideoRef = useRef<HTMLVideoElement>(null);
  const localFrameRef = useRef(localFrame);
  localFrameRef.current = localFrame;

  const resolvedPinned = resolveActiveTrackForShot(
    entry.shot,
    "pinned",
    pinnedTrackIds
  );
  const resolvedSource = resolveActiveTrackForShot(
    entry.shot,
    "source",
    pinnedTrackIds
  );

  const renderVideoUrl = useShotVideoUrl(
    resolvedPinned.clip?.asset_id,
    resolvedPinned.trackId
  );
  const sourceVideoUrl = useShotVideoUrl(
    resolvedSource.clip?.asset_id,
    resolvedSource.trackId
  );

  const renderOffset = entry.renderOffset;
  const renderDuration = entry.renderDuration;
  const renderEnd = renderOffset + renderDuration;

  const isInRenderRange =
    renderDuration > 0 && localFrame >= renderOffset && localFrame < renderEnd;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !renderVideoUrl) return;
    if (video.src !== renderVideoUrl) {
      video.src = renderVideoUrl;
      video.load();
    }
  }, [renderVideoUrl]);

  // oxlint-disable-next-line react-hooks/exhaustive-deps -- External sync: play/pause video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.src) return;

    const shouldPlayRenderVideo = isActive && isPlaying && isInRenderRange;

    if (shouldPlayRenderVideo) {
      if (video.paused) {
        video.currentTime = (localFrameRef.current - renderOffset) / fps;
        video.play().catch(() => {});
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [isActive, isPlaying, isInRenderRange, fps, renderOffset]);

  // oxlint-disable-next-line react-hooks/exhaustive-deps -- External sync: seek video when paused
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.src || !isActive || isPlaying) return;

    if (isInRenderRange) {
      video.currentTime = (localFrame - renderOffset) / fps;
    }
  }, [isActive, isPlaying, localFrame, fps, isInRenderRange, renderOffset]);

  useEffect(() => {
    const video = sourceVideoRef.current;
    if (!video || !sourceVideoUrl) return;
    if (video.src !== sourceVideoUrl) {
      video.src = sourceVideoUrl;
      video.load();
    }
  }, [sourceVideoUrl]);

  // oxlint-disable-next-line react-hooks/exhaustive-deps -- External sync: play/pause video element
  useEffect(() => {
    const video = sourceVideoRef.current;
    if (!video || !video.src) return;

    const shouldPlaySourceVideo = isActive && isPlaying && !isInRenderRange;

    if (shouldPlaySourceVideo) {
      if (video.paused) {
        video.currentTime = localFrameRef.current / fps;
        video.play().catch(() => {});
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [isActive, isPlaying, isInRenderRange, fps]);

  // oxlint-disable-next-line react-hooks/exhaustive-deps -- External sync: seek video when paused
  useEffect(() => {
    const video = sourceVideoRef.current;
    if (!video || !video.src || !isActive || isPlaying) return;

    if (!isInRenderRange) {
      video.currentTime = localFrame / fps;
    }
  }, [isActive, isPlaying, localFrame, fps, isInRenderRange]);

  // oxlint-disable-next-line react-hooks/exhaustive-deps -- External sync: video playback rAF loop
  useEffect(() => {
    if (!isActive || !isPlaying) return;

    let rafId: number;

    const tick = () => {
      const video = videoRef.current;
      const sourceVideo = sourceVideoRef.current;
      const currentLocal = localFrameRef.current;

      if (video && !video.paused && video.src) {
        const videoFrame = Math.round(video.currentTime * fps);
        onTimeUpdateRef.current(entry, renderOffset + videoFrame);
      } else if (sourceVideo && !sourceVideo.paused && sourceVideo.src) {
        const videoFrame = Math.round(sourceVideo.currentTime * fps);
        onTimeUpdateRef.current(entry, videoFrame);
      } else {
        onTimeUpdateRef.current(entry, currentLocal + 1);
      }

      rafId = requestAnimationFrame(tick);
    };

    const timerId = setTimeout(() => {
      rafId = requestAnimationFrame(tick);
    }, PLAYBACK_START_DELAY_MS);

    return () => {
      clearTimeout(timerId);
      cancelAnimationFrame(rafId);
    };
  }, [isActive, isPlaying, entry, fps, renderOffset, onTimeUpdateRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive || !isPlaying) return;

    const handleEnded = () => {};

    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [isActive, isPlaying]);

  const showSource = isActive && !isInRenderRange && !resolvedSource.isBlank;
  const showRender = isActive && isInRenderRange && !resolvedPinned.isBlank;

  return (
    <>
      {!resolvedSource.isBlank && (
        <video
          ref={sourceVideoRef}
          className="absolute inset-0 h-full w-full object-contain"
          style={{ display: showSource ? "block" : "none" }}
          playsInline
          preload="auto"
        />
      )}
      {!resolvedPinned.isBlank && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-contain"
          style={{ display: showRender ? "block" : "none" }}
          playsInline
          preload="auto"
        />
      )}
    </>
  );
}
