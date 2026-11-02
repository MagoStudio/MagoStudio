import { VideoModelDefinition, VideoSettings } from "@models/video/types";

import { getDeclaredVideoSettingKeysForModel } from "./getDeclaredVideoSettingKeysForModel";

export const filterVideoSettingsPatchToModel = (
  videoSettingsPatch: Partial<VideoSettings>,
  model: VideoModelDefinition
): Partial<VideoSettings> => {
  const declaredKeys = getDeclaredVideoSettingKeysForModel(model);

  return Object.fromEntries(
    Object.entries(videoSettingsPatch).filter(([key]) => declaredKeys.has(key))
  );
};
