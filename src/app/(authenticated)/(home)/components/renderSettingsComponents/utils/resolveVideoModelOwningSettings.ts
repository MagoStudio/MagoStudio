import { Img2ImgSettings } from "@models/img2img/types";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { getVideoModelByEngine } from "@models/video/utils/getVideoModelByEngine";

export const resolveVideoModelOwningSettings = (
  settings: Img2ImgSettings | VideoSettings | undefined
): VideoModelDefinition | undefined => {
  const engineNamedInSettings =
    typeof settings?.mago_engine === "string"
      ? settings.mago_engine
      : undefined;

  return getVideoModelByEngine(engineNamedInSettings);
};
