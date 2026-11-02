import { SourceImage } from "@domains/renders/types";

export const resolveMiniMaxH3EditedFrameSourceFrame = ({
  renderSettingsValues,
  editedFrame
}: {
  renderSettingsValues: Record<string, unknown>;
  editedFrame: SourceImage | undefined;
}): number | undefined => {
  if (!editedFrame) return undefined;
  const isEditedFrameFromModifyFrame =
    typeof renderSettingsValues.keyframe_index === "number" &&
    renderSettingsValues.keyframe_index_asset_id === editedFrame.asset_id;
  if (isEditedFrameFromModifyFrame)
    return renderSettingsValues.keyframe_index as number;
  const isEditedFrameFromReusedRender =
    renderSettingsValues.vfx_edited_frame_id === editedFrame.asset_id &&
    typeof renderSettingsValues.vfx_edited_frame_source_frame === "number";
  return isEditedFrameFromReusedRender
    ? (renderSettingsValues.vfx_edited_frame_source_frame as number)
    : undefined;
};
