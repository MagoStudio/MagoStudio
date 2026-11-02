/* oxlint-disable custom-react/no-use-effect -- legitimate external sync: an out-of-band playhead change (e.g. via keyboard hotkeys) must propagate to mask_frame_idx while the editor is open and no points are placed. */

import { parseMaskPoints } from "@domains/sam/utils/parseMaskPoints";
import { useInputTrack } from "@domains/track/useInputTrack";
import {
  getTimelineOffset,
  toOutputFrame
} from "@domains/track/utils/frameCoordinates";
import { currentVideoFrameAtom } from "@store/atoms";
import { maskViewportActiveAtom } from "@store/maskPreviewStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

export const useMaskFramePlayheadCoupling = () => {
  const isViewportActive = useAtomValue(maskViewportActiveAtom);
  const currentVideoFrame = useAtomValue(currentVideoFrameAtom);
  const { renderSettingsValuesAtom, updateValueAtom } =
    useRenderSettingsAtoms();
  const renderSettings = useAtomValue(renderSettingsValuesAtom);
  const updateValue = useSetAtom(updateValueAtom);

  const { inputTrack } = useInputTrack();
  const timelineOffset = getTimelineOffset(inputTrack);

  const maskFrameIdx =
    (renderSettings?.mask_frame_idx as number | undefined) ?? 0;
  const hasPoints =
    parseMaskPoints(renderSettings?.mask_visual_selection as string | undefined)
      .length > 0;

  useEffect(() => {
    if (!isViewportActive || hasPoints) return;
    const nextMaskFrameIdx = toOutputFrame({
      sourceFrame: currentVideoFrame,
      offset: timelineOffset
    });
    if (nextMaskFrameIdx === maskFrameIdx) return;
    updateValue({ key: "mask_frame_idx", value: nextMaskFrameIdx });
  }, [
    isViewportActive,
    hasPoints,
    currentVideoFrame,
    timelineOffset,
    maskFrameIdx,
    updateValue
  ]);
};
