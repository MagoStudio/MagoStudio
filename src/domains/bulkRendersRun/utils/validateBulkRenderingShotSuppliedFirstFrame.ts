import { BulkRenderingFirstFrameSource } from "@store/atoms";

import { SettingValidationError } from "./validateBulkRenderingShotVideoSettings";

export const validateBulkRenderingShotSuppliedFirstFrame = ({
  firstFrameSource,
  hasUploadedFirstFrame
}: {
  firstFrameSource: BulkRenderingFirstFrameSource | undefined;
  hasUploadedFirstFrame: boolean;
}): SettingValidationError[] => {
  const isMissingSuppliedFirstFrame =
    firstFrameSource === "uploaded" && !hasUploadedFirstFrame;

  if (!isMissingSuppliedFirstFrame) return [];

  return [
    {
      key: "firstFrame",
      message:
        "bulk_rendering.draft_shot_missing_uploaded_first_frame_error.label"
    }
  ];
};
