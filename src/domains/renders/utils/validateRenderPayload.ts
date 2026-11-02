import {
  getRenderValidationErrorKeys,
  MASK_RANGE_ERROR_KEY_PREFIX,
  RenderValidationInputs,
  SAM_FRAME_NOT_IN_RANGE_ERROR_KEY
} from "./getRenderValidationErrorKeys";

export type RenderTarget = "range" | "fullClip";

export interface ValidateRenderPayloadParams extends RenderValidationInputs {
  target: RenderTarget;
}

export interface RenderPayloadValidationResult {
  isRenderPayloadValid: boolean;
  errorKeys: string[];
}

export const validateRenderPayload = (
  params: ValidateRenderPayloadParams
): RenderPayloadValidationResult => {
  const allErrorKeys = getRenderValidationErrorKeys(params);
  const errorKeys =
    params.target === "fullClip"
      ? allErrorKeys.filter(
          (errorKey) =>
            errorKey !== SAM_FRAME_NOT_IN_RANGE_ERROR_KEY &&
            !errorKey.startsWith(MASK_RANGE_ERROR_KEY_PREFIX)
        )
      : allErrorKeys;
  return { isRenderPayloadValid: errorKeys.length === 0, errorKeys };
};
