import { RefObject } from "react";

export const useExclusiveVideoPlayback = (
  containerRef: RefObject<HTMLElement | null>
) => {
  const pauseOtherVideos = (playingVideo: HTMLVideoElement) => {
    const videos = containerRef.current?.querySelectorAll("video") ?? [];
    for (const video of videos) {
      if (video !== playingVideo && !video.paused) video.pause();
    }
  };

  return { pauseOtherVideos };
};
