import { SourceImage } from "@domains/renders/types";
import { findMiniMaxH3EditedFrame } from "@domains/renders/utils/findMiniMaxH3EditedFrame";
import { resolveMiniMaxH3EditedFrameSourceFrame } from "@domains/renders/utils/resolveMiniMaxH3EditedFrameSourceFrame";
import { VideoEngine } from "@models/video/types";

import { resolveMiniMaxH3VfxMode } from "../../../../desktop/shared/minimaxH3VfxModes";

export const MINIMAX_H3_EDITED_FRAME_NOT_AT_RANGE_START_ERROR_KEY =
  "renderSettings.minimaxH3EditedFrame.notAtRangeStart";

export const getMiniMaxH3EditedFrameRangeErrorKey = ({
  modelName,
  renderSettingsValues,
  sources,
  rangeFrames
}: {
  modelName: string;
  renderSettingsValues: Record<string, unknown>;
  sources: SourceImage[];
  rangeFrames: [number, number];
}): string | undefined => {
  const isVfxEditWithEditedFrame =
    modelName === VideoEngine.minimax_h3_local &&
    resolveMiniMaxH3VfxMode(renderSettingsValues.vfx_mode) === "vfx_edit";
  if (!isVfxEditWithEditedFrame) return undefined;
  const editedFrameSourceFrame = resolveMiniMaxH3EditedFrameSourceFrame({
    renderSettingsValues,
    editedFrame: findMiniMaxH3EditedFrame(sources)
  });
  if (editedFrameSourceFrame === undefined) return undefined;
  return editedFrameSourceFrame === rangeFrames[0]
    ? undefined
    : MINIMAX_H3_EDITED_FRAME_NOT_AT_RANGE_START_ERROR_KEY;
};
