import { SourceImageType } from "@domains/renders/types";
import { VideoModelDefinition } from "@models/video/types";
import { getPrimarySourceSlotRoles } from "@models/video/utils/getPrimarySourceSlotRoles";

export const sourceRolesFillingPrimarySlot = (
  model: VideoModelDefinition
): SourceImageType[] => [
  ...getPrimarySourceSlotRoles(model),
  ...(model.capabilities.wireSourceRoles ?? [])
];
