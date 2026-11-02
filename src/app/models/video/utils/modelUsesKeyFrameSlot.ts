import { VideoModelDefinition } from "@models/video/types";
import { getPrimarySourceSlotRole } from "@models/video/utils/getPrimarySourceSlotRole";

export const modelUsesKeyFrameSlot = (model: VideoModelDefinition): boolean => {
  const primarySlotRole = getPrimarySourceSlotRole(model);
  return primarySlotRole !== undefined && primarySlotRole !== "reference_frame";
};
