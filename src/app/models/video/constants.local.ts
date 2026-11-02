import { happyHorse1Model } from "./happyHorse1Model";
import { kling2_6MotionControlModel } from "./kling2_6MotionControlModel";
import { kling3_0MotionControlModel } from "./kling3_0MotionControlModel";
import { klingO1Model } from "./klingO1Model";
import { klingO3EditProModel } from "./klingO3EditProModel";
import { ltx23SpatialUpscalerModel } from "./ltx23SpatialUpscalerModel";
import { magoAnimateModel } from "./magoAnimateModel";
import { magoStyleTransferLocalModel } from "./magoStyleTransferLocalModel";
import { magoV1_0_0upscalerRenderModel } from "./magoV1_0_0upscalerRenderModel";
import { magoV2_0_0EsrganUpscalerRenderModel } from "./magoV2_0_0EsrganUpscalerRenderModel";
import { magoV2_5_0RenderModel } from "./magoV2_5_0VideoModel";
import { magoV3_1_0RenderModel } from "./magoV3_1_0VideoModel";
import { magoV3_2_0RenderModel } from "./magoV3_2_0VideoModel";
import { magoV3_3_0_cnetsRenderModel } from "./magoV3_3_0_cnetsVideoModel";
import { magoV3_3_0RenderModel } from "./magoV3_3_0VideoModel";
import { magoV3_4_0RenderModel } from "./magoV3_4_0VideoModel";
import { magoV4_0_0RenderModel } from "./magoV4_0_0VideoModel";
import { magoV4_1_0RenderModel } from "./magoV4_1_0VideoModel";
import { magoV5_0_0RenderModel } from "./magoV5_0_0VideoModel";
import { magoV7_0_0RenderModel } from "./magoV7_0_0VideoModel";
import { magoV8_0_0RenderModel } from "./magoV8_0_0VideoModel";
import { minimaxH3LocalModel } from "./minimaxH3LocalModel";
import { minimaxReferenceVideoModel } from "./minimaxReferenceVideoModel";
import { seedance2_5Model } from "./seedance2_5Model";
import { seedance2I2vFastModel } from "./seedance2I2vFastModel";
import { seedance2I2vModel } from "./seedance2I2vModel";
import { seedance2Model } from "./seedance2Model";
import { VideoEngine, VideoModelDefinition } from "./types";
import { v1_0_0_maskRenderModel } from "./v1_0_0_maskVideoModel";
import { v5_1_0InpaintingRenderModel } from "./v5_1_0InpaintingVideoModel";
import { wanAnimate22Model } from "./wanAnimate22Model";
import { wanVace21Model } from "./wanVace21Model";

export const RENDER_MODELS: VideoModelDefinition[] = [
  magoV4_0_0RenderModel,
  magoV4_1_0RenderModel,
  magoV5_0_0RenderModel,
  magoV7_0_0RenderModel,
  magoV3_4_0RenderModel,
  v5_1_0InpaintingRenderModel,
  magoV8_0_0RenderModel,
  happyHorse1Model,
  wanAnimate22Model,
  wanVace21Model,
  magoStyleTransferLocalModel,
  magoAnimateModel,
  seedance2Model,
  seedance2_5Model,
  minimaxReferenceVideoModel,
  minimaxH3LocalModel,
  seedance2I2vModel,
  seedance2I2vFastModel,
  klingO3EditProModel,
  kling3_0MotionControlModel,
  kling2_6MotionControlModel,
  klingO1Model,
  v1_0_0_maskRenderModel,
  magoV1_0_0upscalerRenderModel,
  magoV2_0_0EsrganUpscalerRenderModel,
  ltx23SpatialUpscalerModel,
  magoV3_3_0_cnetsRenderModel,
  magoV3_3_0RenderModel,
  magoV3_2_0RenderModel,
  magoV2_5_0RenderModel,
  magoV3_1_0RenderModel
];

export const UPSCALE_MODELS: VideoEngine[] = [
  VideoEngine.v1_0_0_upscaler,
  VideoEngine.v2_0_0_esrgan_upscaler,
  VideoEngine.V7_0_0,
  VideoEngine.ltx_2_3_spatial_upscaler
];

export { QUALITY_RETRY_UNSUPPORTED_ENGINES, VIDEO_ONLY_ENGINES } from "./types";

export const DEFAULT_RENDER_MODEL = minimaxH3LocalModel;
