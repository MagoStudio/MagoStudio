import { SourceImage } from "@domains/renders/types";
import {
  NormalizedCropRect,
  toCropWireFields
} from "@domains/renders/utils/cropRect";
import { doesModelDisableFacemeshBlending } from "@domains/renders/utils/doesModelDisableFacemeshBlending";
import { doesModelSupportVideoReferenceToggle } from "@domains/renders/utils/doesModelSupportVideoReferenceToggle";
import { isCropCapableEngine } from "@domains/renders/utils/isCropCapableEngine";
import { RenderMode } from "@hooks/types";
import {
  IMAGE_SEQUENCE_EXPORT,
  VideoEngine,
  VideoSettings,
  VideoModelDefinition
} from "@models/video/types";
import { settingKeysHiddenByAnotherSettingsValue } from "@models/video/utils/settingKeysHiddenByAnotherSettingsValue";

import {
  shapeRenderDataForBackend,
  stripLegacySourceSettingKey,
  stripStaleBackendReferenceKeys
} from "./shapeRenderDataForBackend";

const LEGACY_WIRE_ONLY_STRIP_KEYS = [
  "source_image_slot",
  "convert_pngs_to_exrs",
  "exr_use_float16",
  "image_sequence_export",
  "additional_reference_image",
  "background_images",
  "character_images",
  "objects_images",
  "keyframe_index"
] as const;

const MODIFY_FRAME_PROVENANCE_SETTING_KEYS = [
  "keyframe_index_asset_id"
] as const;

export const SOURCE_SYNTHESIZED_SETTING_KEYS = [
  "image_ids",
  "reference_image_id",
  "frontal_image_id",
  "use_video_reference"
] as const;

export const FE_ONLY_SETTING_KEYS = [
  ...LEGACY_WIRE_ONLY_STRIP_KEYS,
  ...MODIFY_FRAME_PROVENANCE_SETTING_KEYS,
  ...SOURCE_SYNTHESIZED_SETTING_KEYS
] as const;

const CROP_WIRE_KEYS = ["crop_coordinates", "source_video_dimensions"] as const;

export interface BuildRenderPayloadInput {
  parentLayerId: string;
  frameRange: number[];
  renderSettings: VideoSettings;
  sources: SourceImage[];
  inputTrackId: string;
  renderEngine: string;
  renderMode: RenderMode;
  model: VideoModelDefinition;
  inputVideoWidth?: number;
  inputVideoHeight?: number;
  fps: number;
  crop?: NormalizedCropRect;
}

const buildCropWireFields = ({
  crop,
  engine,
  inputVideoWidth,
  inputVideoHeight
}: {
  crop: NormalizedCropRect | undefined;
  engine: string | undefined;
  inputVideoWidth: number | undefined;
  inputVideoHeight: number | undefined;
}): {
  crop_coordinates?: {
    top_left: [number, number];
    bottom_right: [number, number];
  };
  source_video_dimensions?: [number, number];
} => {
  if (!isCropCapableEngine(engine)) return {};

  return toCropWireFields({
    crop,
    sourceWidth: inputVideoWidth,
    sourceHeight: inputVideoHeight
  });
};

const normalizeForEngine = (settings: VideoSettings): VideoSettings =>
  doesModelDisableFacemeshBlending(settings.mago_engine as VideoEngine)
    ? { ...settings, enable_facemesh_blending: false }
    : settings;

const stripKeys = (
  settings: VideoSettings,
  keys: readonly string[]
): Record<string, unknown> => {
  const wire: Record<string, unknown> = { ...settings };
  for (const key of keys) {
    delete wire[key];
  }
  return wire;
};

const stripStaleCropKeys = (
  settings: Record<string, unknown>
): Record<string, unknown> => {
  const wire = { ...settings };
  for (const key of CROP_WIRE_KEYS) {
    delete wire[key];
  }
  return wire;
};

export interface RenderRequestBody {
  parent_layer_id: string;
  frame_range: number[];
  render_mode: RenderMode;
  render_settings: { magov2: Record<string, unknown> };
  sources: ReturnType<typeof shapeRenderDataForBackend>["sources"];
  render_engine: string;
}

export const buildRenderPayload = ({
  parentLayerId,
  frameRange,
  renderSettings,
  sources,
  inputTrackId,
  renderEngine,
  renderMode,
  model,
  inputVideoWidth,
  inputVideoHeight,
  fps,
  crop
}: BuildRenderPayloadInput): RenderRequestBody => {
  const settingsWithoutSourceSynthesizedKeys = stripKeys(
    renderSettings,
    SOURCE_SYNTHESIZED_SETTING_KEYS
  ) as VideoSettings;

  const transformed = model.formatValuesForBackend
    ? model.formatValuesForBackend(settingsWithoutSourceSynthesizedKeys, {
        inputVideoWidth,
        inputVideoHeight,
        frameRange,
        fps,
        sources
      })
    : settingsWithoutSourceSynthesizedKeys;
  const normalized = normalizeForEngine(transformed);
  const wireSettings = stripStaleCropKeys(
    stripStaleBackendReferenceKeys(
      stripLegacySourceSettingKey(
        stripKeys(normalized, [
          ...LEGACY_WIRE_ONLY_STRIP_KEYS,
          ...MODIFY_FRAME_PROVENANCE_SETTING_KEYS,
          ...settingKeysHiddenByAnotherSettingsValue(model, renderSettings)
        ])
      )
    )
  );

  const effectiveSources = model.formatSourcesForBackend
    ? model.formatSourcesForBackend(settingsWithoutSourceSynthesizedKeys, {
        inputVideoWidth,
        inputVideoHeight,
        frameRange,
        fps,
        sources
      })
    : sources;

  const omitSourceVideo =
    doesModelSupportVideoReferenceToggle(model.name) &&
    renderSettings.use_video_reference === false;

  const { sources: shapedSources } = shapeRenderDataForBackend({
    renderSettings: normalized,
    sources: effectiveSources,
    engine: normalized.mago_engine as string | undefined,
    inputTrackId,
    inputMask:
      typeof normalized.input_mask === "string"
        ? normalized.input_mask
        : undefined,
    hasModelOwnedSources: Boolean(model.formatSourcesForBackend),
    omitSourceVideo
  });

  const cropWireFields = buildCropWireFields({
    crop,
    engine: normalized.mago_engine as string | undefined,
    inputVideoWidth,
    inputVideoHeight
  });

  return {
    parent_layer_id: parentLayerId,
    frame_range: frameRange,
    render_mode: renderMode,
    render_settings: {
      magov2: {
        ...wireSettings,
        frame_range: frameRange,
        denoise_upscale: 0,
        steps_upscale: 1,
        model_path: "./1.pth",
        ...cropWireFields,
        mago_engine: normalized.mago_engine,
        convert_exrs_to_pngs:
          normalized.image_sequence_export !== IMAGE_SEQUENCE_EXPORT.EXR_16BIT
      }
    },
    sources: shapedSources,
    render_engine: renderEngine
  };
};
