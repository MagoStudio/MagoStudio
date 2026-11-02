/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { currentVideoFrameAtom, isPlayingAtom } from "@store/atoms";
import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";

import { useFpsForShot } from "./useFpsForShot";
import { useGlobalPlayableFrameRange } from "./useGlobalPlayableFrameRange";

export function useVideoPlayerTimeLoop() {
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const { fps } = useFpsForShot();
  const setCurrentVideoFrame = useSetAtom(currentVideoFrameAtom);
  const { globalPlayableFrameRange } = useGlobalPlayableFrameRange();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [setIsPlaying]);

  useEffect(() => {
    if (
      !isPlaying ||
      !fps ||
      globalPlayableFrameRange.start === Infinity ||
      globalPlayableFrameRange.end === -Infinity
    ) {
      return;
    }

    const frameDuration = 1000 / fps;

    const interval = setInterval(() => {
      setCurrentVideoFrame((prevFrame) => {
        if (
          prevFrame < globalPlayableFrameRange.start ||
          prevFrame > globalPlayableFrameRange.end
        ) {
          setIsPlaying(false);
          return globalPlayableFrameRange.start;
        }
        if (prevFrame >= globalPlayableFrameRange.end) {
          return globalPlayableFrameRange.start;
        }
        return prevFrame + 1;
      });
    }, frameDuration);

    return () => clearInterval(interval);
  }, [
    isPlaying,
    fps,
    globalPlayableFrameRange.start,
    globalPlayableFrameRange.end,
    setCurrentVideoFrame,
    setIsPlaying
  ]);
}
