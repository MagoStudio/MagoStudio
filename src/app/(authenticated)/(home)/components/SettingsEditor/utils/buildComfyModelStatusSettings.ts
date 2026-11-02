import { SourceImage } from "@domains/renders/types";
import { findMiniMaxH3EditedFrame } from "@domains/renders/utils/findMiniMaxH3EditedFrame";
import { VideoEngine } from "@models/video/types";

import { resolveMiniMaxH3VfxMode } from "../../../../../../../desktop/shared/minimaxH3VfxModes";

const MODEL_SIZE_SETTING_KEY_BY_MODEL: Partial<Record<string, string>> = {
  [VideoEngine.wan_vace_2_1]: "vace_model_size",
  [VideoEngine.mago_style_transfer_local]: "fun_model_size",
  [VideoEngine.mago_animate]: "animate_model_size",
  [VideoEngine.ltx_2_3_spatial_upscaler]: "ltx_upscale_factor"
};

const buildMiniMaxH3StatusSettings = (
  renderSettingsValues: Record<string, unknown>,
  sources: SourceImage[]
): Record<string, unknown> => {
  const isVfxEditSelected =
    resolveMiniMaxH3VfxMode(renderSettingsValues.vfx_mode) === "vfx_edit";
  const minimaxH3EditedFrameId = isVfxEditSelected
    ? findMiniMaxH3EditedFrame(sources)?.asset_id
    : undefined;
  return {
    h3_quality: renderSettingsValues.h3_quality,
    vfx_mode: renderSettingsValues.vfx_mode,
    vfx_edited_frame_id: minimaxH3EditedFrameId
  };
};

export const buildComfyModelStatusSettings = ({
  modelName,
  renderSettingsValues,
  sources
}: {
  modelName: string;
  renderSettingsValues: Record<string, unknown>;
  sources: SourceImage[];
}): Record<string, unknown> => {
  if (modelName === VideoEngine.minimax_h3_local)
    return buildMiniMaxH3StatusSettings(renderSettingsValues, sources);
  const modelSizeSettingKey = MODEL_SIZE_SETTING_KEY_BY_MODEL[modelName];
  return modelSizeSettingKey
    ? { [modelSizeSettingKey]: renderSettingsValues[modelSizeSettingKey] }
    : {};
};
