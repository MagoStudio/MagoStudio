import { VideoEngine } from "@models/video/types";

export const LOCAL_VIDEO_MODELS = [
  VideoEngine.seedance_2,
  VideoEngine.happy_horse_1,
  VideoEngine.wan_animate_2_2,
  VideoEngine.wan_vace_2_1,
  VideoEngine.mago_style_transfer_local,
  VideoEngine.mago_animate,
  VideoEngine.ltx_2_3_spatial_upscaler,
  VideoEngine.minimax_h3_local,
  VideoEngine.kling_o1,
  VideoEngine.kling_o3_edit_pro,
  VideoEngine.kling_2_6_motion_control,
  VideoEngine.kling_3_motion_control,
  VideoEngine.seedance_2_i2v,
  VideoEngine.seedance_2_i2v_fast
] as const;

const LOCAL_IMAGE_TO_VIDEO_MODELS = [
  VideoEngine.seedance_2_i2v,
  VideoEngine.seedance_2_i2v_fast
] as const;

export const isImageToVideoLocalVideoModel = (
  model: VideoEngine | string | undefined
): model is (typeof LOCAL_IMAGE_TO_VIDEO_MODELS)[number] =>
  LOCAL_IMAGE_TO_VIDEO_MODELS.some((candidate) => candidate === model);

const LOCAL_KLING_MODELS = [
  VideoEngine.kling_o1,
  VideoEngine.kling_o3_edit_pro,
  VideoEngine.kling_2_6_motion_control,
  VideoEngine.kling_3_motion_control
] as const;

export const isKlingLocalVideoModel = (
  model: VideoEngine | string | undefined
): model is (typeof LOCAL_KLING_MODELS)[number] =>
  LOCAL_KLING_MODELS.some((candidate) => candidate === model);

const COMFY_LOCAL_VIDEO_MODELS = [
  VideoEngine.wan_animate_2_2,
  VideoEngine.wan_vace_2_1,
  VideoEngine.mago_style_transfer_local,
  VideoEngine.mago_animate,
  VideoEngine.ltx_2_3_spatial_upscaler,
  VideoEngine.minimax_h3_local
] as const;

export const isComfyLocalVideoModel = (
  model: VideoEngine | string | undefined
): model is (typeof COMFY_LOCAL_VIDEO_MODELS)[number] =>
  COMFY_LOCAL_VIDEO_MODELS.some((candidate) => candidate === model);

export const isLocalVideoModel = (
  model: VideoEngine | string | undefined
): model is (typeof LOCAL_VIDEO_MODELS)[number] =>
  LOCAL_VIDEO_MODELS.some((candidate) => candidate === model);
