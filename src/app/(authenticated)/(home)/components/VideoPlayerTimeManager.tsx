"use client";

import { useVideoPlayerTimeLoop } from "@domains/videoPlayer/useVideoPlayerTimeLoop";

export function VideoPlayerTimeManager() {
  useVideoPlayerTimeLoop();
  return null;
}
