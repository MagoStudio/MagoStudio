import { IMAGE_SEQUENCE_EXPORT, VideoSettings } from "@models/video/types";

export const deriveImageSequenceExport = (
  settings: VideoSettings
): VideoSettings => {
  if (!("convert_exrs_to_pngs" in settings)) return settings;
  const next = { ...settings } as VideoSettings & Record<string, unknown>;
  next.image_sequence_export =
    next.convert_exrs_to_pngs === false
      ? IMAGE_SEQUENCE_EXPORT.EXR_16BIT
      : IMAGE_SEQUENCE_EXPORT.PNG;
  delete next.convert_exrs_to_pngs;
  return next;
};
