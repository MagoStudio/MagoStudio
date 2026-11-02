import { SourceImageType } from "@domains/renders/types";
import { parseSourceImageTypes } from "@domains/renders/utils/parseSourceImageTypes";
import { VideoModelDefinition } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";

export const modelSupportedSourceRoles = (
  model: VideoModelDefinition
): Set<SourceImageType> => {
  const roles = new Set<SourceImageType>();

  for (const section of flattenSettingsGroups(model)) {
    for (const setting of section.settings) {
      for (const role of parseSourceImageTypes(
        setting.specificConfig?.sourceRoles
      )) {
        roles.add(role);
      }
    }
  }

  for (const role of model.capabilities.wireSourceRoles ?? []) {
    roles.add(role);
  }

  return roles;
};
