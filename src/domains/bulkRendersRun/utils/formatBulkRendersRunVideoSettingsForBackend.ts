import { doesModelDisableFacemeshBlending } from "@domains/renders/utils/doesModelDisableFacemeshBlending";
import {
  IMAGE_SEQUENCE_EXPORT,
  isFrameBasedModelLimits,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";

const DEFAULT_TIME_BASED_FPS = 24;
const DEFAULT_TIME_BASED_DURATION_SECONDS = 5;

export interface FormatBulkRendersRunVideoSettingsForBackendInput {
  videoSettings: VideoSettings;
  videoModel: VideoModelDefinition;
  frameRange: [number, number];
}

const applyModelFormatter = ({
  videoSettings,
  videoModel,
  frameRange
}: FormatBulkRendersRunVideoSettingsForBackendInput): VideoSettings => {
  if (!videoModel.formatValuesForBackend) return videoSettings;

  const modelHasFrameBasedDurationLimits = isFrameBasedModelLimits(
    videoModel.renderDurationLimits.modelLimits
  );

  if (modelHasFrameBasedDurationLimits) {
    return videoModel.formatValuesForBackend(videoSettings, {
      frameRange,
      fps: 0,
      sources: []
    });
  }

  const fps = (videoSettings.fps as number) || DEFAULT_TIME_BASED_FPS;
  const durationInSeconds =
    (videoSettings.durationInSeconds as number) ||
    DEFAULT_TIME_BASED_DURATION_SECONDS;

  return videoModel.formatValuesForBackend(videoSettings, {
    frameRange: [0, Math.round(durationInSeconds * fps)],
    fps,
    sources: []
  });
};

export const formatBulkRendersRunVideoSettingsForBackend = (
  input: FormatBulkRendersRunVideoSettingsForBackendInput
): VideoSettings => {
  const modelFormattedSettings = applyModelFormatter(input);

  const settingsWithFacemeshNormalized = doesModelDisableFacemeshBlending(
    input.videoModel.name
  )
    ? { ...modelFormattedSettings, enable_facemesh_blending: false }
    : modelFormattedSettings;

  const imageSequenceExport =
    settingsWithFacemeshNormalized.image_sequence_export;

  return {
    ...settingsWithFacemeshNormalized,
    convert_exrs_to_pngs:
      imageSequenceExport !== undefined
        ? imageSequenceExport !== IMAGE_SEQUENCE_EXPORT.EXR_16BIT
        : ((input.videoSettings.convert_exrs_to_pngs as boolean | undefined) ??
          true)
  };
};
