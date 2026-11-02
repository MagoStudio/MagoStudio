import { SourceImage } from "@domains/renders/types";
import {
  isShotCroppedSectionOfInputVideo,
  NormalizedCropRect
} from "@domains/renders/utils/cropRect";
import { isCropCapableEngine } from "@domains/renders/utils/isCropCapableEngine";
import { toSourceFrame } from "@domains/track/utils/frameCoordinates";
import { generateVideoValidationSchema } from "@models/video/generateVideoValidationSchema";
import {
  ComputedRenderLimits,
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { Layer } from "@schemas/layer";

import { getFrameRangeLength } from "./getFrameRangeLength";
import { getImageSourceCropMismatchError } from "./getImageSourceCropMismatchError";
import { getMaskCropMismatchError } from "./getMaskCropMismatchError";
import { getMaskRangeError } from "./getMaskRangeError";
import { getMiniMaxH3EditedFrameRangeErrorKey } from "./getMiniMaxH3EditedFrameRangeErrorKey";
import { isMaskModel } from "./isMaskModel";

export const SAM_FRAME_NOT_IN_RANGE_ERROR_KEY =
  "masking.sam_frame_not_in_range.description";

export const MASK_RANGE_ERROR_KEY_PREFIX = "inpainting.mask_range_error.";

export const MASK_CROP_MISMATCH_ERROR_KEY =
  "crop.mask_crop_mismatch.description";

export const IMAGE_SOURCE_CROP_MISMATCH_ERROR_KEY =
  "crop.image_source_crop_mismatch.description";

export const CROP_MISSING_INPUT_DIMENSIONS_ERROR_KEY =
  "crop.missing_input_dimensions.description";

export interface RenderValidationInputs {
  model: VideoModelDefinition;
  renderSettingsValues: VideoSettings;
  sources: SourceImage[];
  fps: number;
  isUnlimitedModeActive: boolean;
  inputVideoWidth: number | undefined;
  inputVideoHeight: number | undefined;
  imageDimensions: Array<{ width: number; height: number }> | undefined;
  rangeFrames: [number, number];
  durationLimits: ComputedRenderLimits;
  maskTrack: Layer | undefined;
  sourceTrackTimelineOffset: number;
  crop: NormalizedCropRect | undefined;
  tracks: Layer[];
}

const getSchemaErrorKeys = (
  model: VideoModelDefinition,
  values: VideoSettings,
  sources: SourceImage[]
): string[] => {
  const schema = generateVideoValidationSchema(model, sources);
  const result = schema.safeParse(values);
  if (!result.success) {
    return result.error.issues.map((issue) => issue.message);
  }
  return [];
};

const getMaskRangeErrorKey = ({
  model,
  renderSettingsValues,
  maskTrack,
  rangeFrames
}: RenderValidationInputs): string | undefined => {
  if (model.name !== VideoEngine.V5_1_0) return undefined;
  if (typeof renderSettingsValues.input_mask !== "string") return undefined;
  const maskRangeError = getMaskRangeError({ maskTrack, rangeFrames });
  return maskRangeError
    ? `${MASK_RANGE_ERROR_KEY_PREFIX}${maskRangeError.kind}.description`
    : undefined;
};

const getSamFrameNotInRangeErrorKey = ({
  model,
  renderSettingsValues,
  sourceTrackTimelineOffset,
  rangeFrames
}: RenderValidationInputs): string | undefined => {
  if (!isMaskModel(model.name)) return undefined;
  const maskMode = renderSettingsValues.mask_mode as string | undefined;
  const usesPoints =
    maskMode === "visual_selection" ||
    maskMode === "prompt_and_visual_selection";
  if (!usesPoints) return undefined;
  const maskFrameIdx = renderSettingsValues.mask_frame_idx as
    | number
    | undefined;
  if (maskFrameIdx === undefined) return undefined;
  const absoluteFrameIdx = toSourceFrame({
    outputFrame: maskFrameIdx,
    offset: sourceTrackTimelineOffset
  });
  const [rangeStart, rangeEnd] = rangeFrames;
  if (absoluteFrameIdx < rangeStart || absoluteFrameIdx > rangeEnd) {
    return SAM_FRAME_NOT_IN_RANGE_ERROR_KEY;
  }
  return undefined;
};

const getInpaintingErrorKeys = ({
  model,
  renderSettingsValues,
  sources
}: RenderValidationInputs): string[] => {
  const isInpaintingModel = model.name === VideoEngine.V5_1_0;
  if (!isInpaintingModel) return [];
  const hasReferenceImage = sources.some(
    (entry) => entry.type === "reference_frame"
  );
  const isMissingImage = !hasReferenceImage;
  const hasMaskPrompt =
    typeof renderSettingsValues.mask_prompt === "string" &&
    renderSettingsValues.mask_prompt.trim().length > 0;
  const isMissingMask = !renderSettingsValues.input_mask && !hasMaskPrompt;
  if (isMissingImage && isMissingMask) {
    return ["inpainting.generate_disabled.missing_both.label"];
  }
  if (isMissingImage) {
    return ["inpainting.generate_disabled.missing_image.label"];
  }
  if (isMissingMask) {
    return ["inpainting.generate_disabled.missing_mask.label"];
  }
  return [];
};

const getSchemaAndContextErrorKeys = ({
  model,
  renderSettingsValues,
  sources,
  fps,
  isUnlimitedModeActive,
  inputVideoWidth,
  inputVideoHeight,
  imageDimensions
}: RenderValidationInputs): string[] => {
  const schemaErrors = getSchemaErrorKeys(model, renderSettingsValues, sources);
  const contextResult = model.validateContext?.({
    fps,
    isUnlimitedModeActive,
    inputVideoWidth,
    inputVideoHeight,
    imageDimensions
  });
  return contextResult &&
    !contextResult.isRenderContextValid &&
    contextResult.errorKey
    ? [...schemaErrors, contextResult.errorKey]
    : schemaErrors;
};

const getCropErrorKeys = ({
  model,
  crop,
  inputVideoWidth,
  inputVideoHeight,
  maskTrack,
  sources,
  tracks
}: RenderValidationInputs): string[] => {
  if (!isCropCapableEngine(model.name)) return [];

  const isShotCroppedSection = isShotCroppedSectionOfInputVideo({ crop });

  if (isShotCroppedSection && (!inputVideoWidth || !inputVideoHeight)) {
    return [CROP_MISSING_INPUT_DIMENSIONS_ERROR_KEY];
  }

  const errorKeys: string[] = [];

  if (
    getMaskCropMismatchError({
      crop,
      inputVideoWidth,
      inputVideoHeight,
      maskTrack
    })
  ) {
    errorKeys.push(MASK_CROP_MISMATCH_ERROR_KEY);
  }

  if (
    getImageSourceCropMismatchError({
      crop,
      inputVideoWidth,
      inputVideoHeight,
      sources,
      tracks
    })
  ) {
    errorKeys.push(IMAGE_SOURCE_CROP_MISMATCH_ERROR_KEY);
  }

  return errorKeys;
};

const getDurationErrorKeys = ({
  rangeFrames,
  durationLimits
}: RenderValidationInputs): string[] => {
  const frameRangeLength = getFrameRangeLength(rangeFrames);
  const {
    minFrames,
    maxFrames,
    modelHasTimeBasedDurationLimits,
    minSeconds,
    maxSeconds
  } = durationLimits;
  const errorKeys: string[] = [];
  if (frameRangeLength < minFrames) {
    if (modelHasTimeBasedDurationLimits && minSeconds !== undefined) {
      errorKeys.push("range.min_duration_seconds.description");
    } else {
      errorKeys.push("range.no_interpolation_min_range.description");
    }
  }
  if (frameRangeLength > maxFrames) {
    if (modelHasTimeBasedDurationLimits && maxSeconds !== undefined) {
      errorKeys.push("range.max_duration_seconds.description");
    } else {
      errorKeys.push("range.max_in_credits_mode.description");
    }
  }
  return errorKeys;
};

export const getRenderValidationErrorKeys = (
  inputs: RenderValidationInputs
): string[] => {
  const maskRangeErrorKey = getMaskRangeErrorKey(inputs);
  const samFrameErrorKey = getSamFrameNotInRangeErrorKey(inputs);
  const editedFrameRangeErrorKey = getMiniMaxH3EditedFrameRangeErrorKey({
    modelName: inputs.model.name,
    renderSettingsValues: inputs.renderSettingsValues,
    sources: inputs.sources,
    rangeFrames: inputs.rangeFrames
  });
  return [
    ...(maskRangeErrorKey ? [maskRangeErrorKey] : []),
    ...(samFrameErrorKey ? [samFrameErrorKey] : []),
    ...(editedFrameRangeErrorKey ? [editedFrameRangeErrorKey] : []),
    ...getInpaintingErrorKeys(inputs),
    ...getSchemaAndContextErrorKeys(inputs),
    ...getDurationErrorKeys(inputs),
    ...getCropErrorKeys(inputs)
  ];
};
