import { SourceImageType } from "@domains/renders/types";
import { parseSourceImageTypes } from "@domains/renders/utils/parseSourceImageTypes";
import { VideoModelDefinition } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";

export const getPrimarySourceSlotRoles = (
  model: VideoModelDefinition
): SourceImageType[] => {
  for (const section of flattenSettingsGroups(model)) {
    for (const setting of section.settings) {
      if (setting.specificConfig?.isPrimarySourceSlot !== true) continue;
      const declaredRoles = parseSourceImageTypes(
        setting.specificConfig?.sourceRoles
      );
      if (declaredRoles.length > 0) return declaredRoles;
    }
  }
  return [];
};
