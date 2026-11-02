import { SourceImage } from "@domains/renders/types";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";

import { normalizeValue } from "./normalizeValue";

export type CopyPayload = Partial<VideoSettings> & {
  presetId?: string;
  sources: SourceImage[];
};

export const buildCopyPayload = (
  model: VideoModelDefinition,
  renderSettings: Partial<VideoSettings>,
  presetId: string | undefined,
  sources: SourceImage[]
): CopyPayload => {
  const allSettings = flattenSettingsGroups(model).flatMap(
    (section) => section.settings
  );

  const validKeys = allSettings.flatMap((setting) =>
    setting.secondKey ? [setting.key, setting.secondKey] : [setting.key]
  );

  const settings: Partial<VideoSettings> = {};
  validKeys.forEach((key) => {
    if (key in renderSettings) {
      (settings as any)[key] = normalizeValue(
        (renderSettings as any)[key],
        key
      );
    }
  });

  settings.mago_engine = model.name;

  return {
    ...settings,
    presetId,
    sources
  } as CopyPayload;
};
