import { VideoModelDefinition } from "@models/video/types";
import { getPrimarySourceSlotRole } from "@models/video/utils/getPrimarySourceSlotRole";

export const modelUsesReferenceFrameSlot = (
  model: VideoModelDefinition
): boolean => getPrimarySourceSlotRole(model) === "reference_frame";
