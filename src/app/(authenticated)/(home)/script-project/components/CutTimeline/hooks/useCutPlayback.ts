import { mapGlobalFrameToShot } from "@domains/project/utils/mapGlobalFrameToShot";
import { CutTimelineClip } from "@domains/scriptProject/utils/buildCutTimelineClips";
import { findNextPlayableCutClipIndex } from "@domains/scriptProject/utils/findNextPlayableCutClipIndex";
import { getCutPlayheadPercent } from "@domains/scriptProject/utils/getCutPlayheadPercent";
import { resolveCutPlaybackFrame } from "@domains/scriptProject/utils/resolveCutPlaybackFrame";
import { SHOT_FPS } from "@domains/scriptProject/utils/snapShotFrames";
import { useMountEffect } from "@hooks/useMountEffect";
import { useRef, useState } from "react";

const FULL_TRACK_PERCENT = 100;

interface UseCutPlaybackArgs {
  clips: CutTimelineClip[];
  totalDurationFrames: number;
}

export const useCutPlayback = ({
  clips,
  totalDurationFrames
}: UseCutPlaybackArgs) => {
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [isCutPlaying, setIsCutPlaying] = useState(false);

  const activeClipIndexRef = useRef(0);
  const isCutPlayingRef = useRef(false);
  const playheadFrameRef = useRef(0);
  const pendingSeekRef = useRef<{
    clipIndex: number;
    localFrame: number;
  } | null>(null);
  const clipVideoElementsRef = useRef(new Map<number, HTMLVideoElement>());
  const metadataListenersRef = useRef(new Map<HTMLVideoElement, () => void>());
  const animationFrameIdRef = useRef<number>(0);
  const playheadRef = useRef<HTMLDivElement>(null);

  const firstPlayableClipIndex = findNextPlayableCutClipIndex(clips, -1);
  const canCutPlay = firstPlayableClipIndex !== null;

  const writePlayheadPercent = (percent: number) => {
    if (!playheadRef.current) return;
    /* eslint-disable-next-line react-compiler/react-compiler -- the playhead moves every animation
     * frame and nothing else reads its position, so writing the style directly avoids re-rendering
     * every clip sixty times a second */
    playheadRef.current.style.left = `${percent}%`;
  };

  const removeMetadataListener = (element: HTMLVideoElement) => {
    const listener = metadataListenersRef.current.get(element);
    if (!listener) return;
    element.removeEventListener("loadedmetadata", listener);
    metadataListenersRef.current.delete(element);
  };

  const registerClipVideoElement = (
    clipIndex: number,
    element: HTMLVideoElement | null
  ) => {
    const previous = clipVideoElementsRef.current.get(clipIndex);
    if (previous) removeMetadataListener(previous);
    if (element) {
      clipVideoElementsRef.current.set(clipIndex, element);
      applyPendingSeek(clipIndex, element);
      return;
    }
    clipVideoElementsRef.current.delete(clipIndex);
  };

  const stopCutPlayback = () => {
    cancelAnimationFrame(animationFrameIdRef.current);
    isCutPlayingRef.current = false;
    setIsCutPlaying(false);
  };

  const applyPendingSeek = (clipIndex: number, element: HTMLVideoElement) => {
    const pending = pendingSeekRef.current;
    if (pending?.clipIndex !== clipIndex) return;
    removeMetadataListener(element);
    const apply = () => {
      removeMetadataListener(element);
      if (
        pendingSeekRef.current !== pending ||
        clipVideoElementsRef.current.get(clipIndex) !== element
      )
        return;
      element.currentTime = pending.localFrame / SHOT_FPS;
      pendingSeekRef.current = null;
      if (isCutPlayingRef.current) void element.play().catch(stopCutPlayback);
    };
    if (element.readyState >= 1) apply();
    else {
      metadataListenersRef.current.set(element, apply);
      element.addEventListener("loadedmetadata", apply, { once: true });
    }
  };

  const writePlayheadFrame = (frame: number) => {
    playheadFrameRef.current = frame;
    writePlayheadPercent(getCutPlayheadPercent(frame, totalDurationFrames));
  };
  const updatePlayheadFromVideo = () => {
    const clip = clips[activeClipIndexRef.current];
    const video = clipVideoElementsRef.current.get(activeClipIndexRef.current);
    if (!clip || !video || pendingSeekRef.current) return;
    writePlayheadFrame(
      resolveCutPlaybackFrame({
        clipStartFrame: clip.startFrame,
        clipDurationFrames: clip.durationFrames,
        videoCurrentTimeSeconds: video.currentTime
      })
    );
  };

  const tickPlayhead = () => {
    const clip = clips[activeClipIndexRef.current];
    const video = clipVideoElementsRef.current.get(activeClipIndexRef.current);

    if (clip && video) {
      const globalFrame = resolveCutPlaybackFrame({
        clipStartFrame: clip.startFrame,
        clipDurationFrames: clip.durationFrames,
        videoCurrentTimeSeconds: video.currentTime
      });
      if (!pendingSeekRef.current) writePlayheadFrame(globalFrame);
    }

    animationFrameIdRef.current = requestAnimationFrame(tickPlayhead);
  };

  const playClipAt = (clipIndex: number, localFrame = 0) => {
    activeClipIndexRef.current = clipIndex;
    setActiveClipIndex(clipIndex);
    pendingSeekRef.current = { clipIndex, localFrame };

    const video = clipVideoElementsRef.current.get(clipIndex);
    if (video) applyPendingSeek(clipIndex, video);
  };

  const rewindCutToStart = () => {
    const startIndex = firstPlayableClipIndex ?? 0;
    activeClipIndexRef.current = startIndex;
    setActiveClipIndex(startIndex);
    pendingSeekRef.current = null;
    writePlayheadFrame(clips[startIndex]?.startFrame ?? 0);
  };

  const advanceToNextPlayableClip = () => {
    const nextIndex = findNextPlayableCutClipIndex(
      clips,
      activeClipIndexRef.current
    );

    if (nextIndex === null) {
      stopCutPlayback();
      rewindCutToStart();
      return;
    }

    playClipAt(nextIndex);
  };

  const seekCutToPercent = (percent: number) => {
    if (totalDurationFrames <= 0) return;

    const globalFrame = Math.round(
      (percent / FULL_TRACK_PERCENT) * totalDurationFrames
    );
    const { shotIndex, localFrame } = mapGlobalFrameToShot(
      globalFrame,
      clips.map((clip) => clip.startFrame),
      clips.map((clip) => clip.durationFrames)
    );

    const targetIndex = clips[shotIndex]?.isClipPlayable
      ? shotIndex
      : findNextPlayableCutClipIndex(clips, shotIndex);
    if (targetIndex === null) return;

    const isLandingOnAnotherClip = targetIndex !== shotIndex;
    const targetLocalFrame = isLandingOnAnotherClip ? 0 : localFrame;
    if (targetIndex !== activeClipIndexRef.current)
      clipVideoElementsRef.current.get(activeClipIndexRef.current)?.pause();

    activeClipIndexRef.current = targetIndex;
    setActiveClipIndex(targetIndex);
    pendingSeekRef.current = {
      clipIndex: targetIndex,
      localFrame: targetLocalFrame
    };

    const video = clipVideoElementsRef.current.get(targetIndex);
    if (video) applyPendingSeek(targetIndex, video);

    writePlayheadFrame(
      (clips[targetIndex]?.startFrame ?? 0) + targetLocalFrame
    );
  };

  const toggleCutPlayback = () => {
    if (isCutPlaying) {
      clipVideoElementsRef.current.get(activeClipIndexRef.current)?.pause();
      updatePlayheadFromVideo();
      stopCutPlayback();
      return;
    }

    if (firstPlayableClipIndex === null) return;

    const shouldRestartFromFirstClip =
      !clips[activeClipIndexRef.current]?.isClipPlayable;
    const startIndex = shouldRestartFromFirstClip
      ? firstPlayableClipIndex
      : activeClipIndexRef.current;

    const clip = clips[startIndex];
    const localFrame = clip
      ? Math.max(
          0,
          Math.min(
            clip.durationFrames,
            playheadFrameRef.current - clip.startFrame
          )
        )
      : 0;
    isCutPlayingRef.current = true;
    setIsCutPlaying(true);
    animationFrameIdRef.current = requestAnimationFrame(tickPlayhead);
    playClipAt(startIndex, localFrame);
  };

  useMountEffect(() => {
    rewindCutToStart();
    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      isCutPlayingRef.current = false;
      pendingSeekRef.current = null;
      for (const element of metadataListenersRef.current.keys())
        removeMetadataListener(element);
      clipVideoElementsRef.current.clear();
    };
  });

  return {
    activeClipIndex,
    isCutPlaying,
    canCutPlay,
    playheadRef,
    toggleCutPlayback,
    seekCutToPercent,
    registerClipVideoElement,
    handleActiveClipEnded: advanceToNextPlayableClip,
    handleActiveClipError: advanceToNextPlayableClip
  };
};
