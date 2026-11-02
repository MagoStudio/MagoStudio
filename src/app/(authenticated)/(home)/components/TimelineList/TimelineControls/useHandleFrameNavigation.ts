import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { currentVideoFrameAtom, isPlayingAtom } from "@store/atoms";
import { useAtomValue, useSetAtom } from "jotai";

export const useHandleFrameNavigation = () => {
  const isPlaying = useAtomValue(isPlayingAtom);
  const currentVideoFrame = useAtomValue(currentVideoFrameAtom);
  const setCurrentVideoFrame = useSetAtom(currentVideoFrameAtom);
  const shotMaxFrames = useShotMaxFrames();

  const handleFrameNavigation = (direction: "left" | "right") => {
    if (isPlaying) return;

    const currentFrame = currentVideoFrame ?? 0;
    const newFrame = direction === "left" ? currentFrame - 1 : currentFrame + 1;

    const clampedFrame = Math.max(0, Math.min(newFrame, shotMaxFrames));

    setCurrentVideoFrame(clampedFrame);
  };

  return handleFrameNavigation;
};
