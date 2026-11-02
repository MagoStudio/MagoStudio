import { useInputTrack } from "@domains/track/useInputTrack";
import {
  getTimelineOffset,
  toSourceFrame
} from "@domains/track/utils/frameCoordinates";
import { currentVideoFrameAtom, isPlayingAtom } from "@store/atoms";
import { maskViewportActiveAtom } from "@store/maskPreviewStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";

export const useOpenMaskEditor = () => {
  const setViewportActive = useSetAtom(maskViewportActiveAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const setCurrentVideoFrame = useSetAtom(currentVideoFrameAtom);
  const { renderSettingsValuesAtom } = useRenderSettingsAtoms();
  const renderSettings = useAtomValue(renderSettingsValuesAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const { inputTrack } = useInputTrack();

  return () => {
    if (isPlaying) {
      setIsPlaying(false);
    }
    const maskFrameIdx =
      (renderSettings?.mask_frame_idx as number | undefined) ?? 0;
    if (maskFrameIdx > 0) {
      setCurrentVideoFrame(
        toSourceFrame({
          outputFrame: maskFrameIdx,
          offset: getTimelineOffset(inputTrack)
        })
      );
    }
    setViewportActive(true);
  };
};
