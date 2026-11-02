import { SourceImageType } from "@domains/renders/types";
import { VideoModelDefinition } from "@models/video/types";
import { getPrimarySourceSlotRoles } from "@models/video/utils/getPrimarySourceSlotRoles";

export const getPrimarySourceSlotRole = (
  model: VideoModelDefinition
): SourceImageType | undefined => getPrimarySourceSlotRoles(model)[0];
