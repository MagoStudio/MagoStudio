import type { MiniMaxH3CrossviewCamera } from "../../shared/minimaxH3VfxModes";

import type { ComfyGraph } from "./comfyGraph";

export const CROSSVIEW_DEPTH_MODEL_FILE = "moge_2_vitl_normal_fp16.safetensors";

const DEPTH_RESOLUTION_LEVEL = 2;
const DEPTH_BATCH_SIZE = 4;
const ASSUMED_HORIZONTAL_FIELD_OF_VIEW_DEGREES = 50;
const SCENE_DEPTH_RATIO = 6;
const LIVE_PREVIEW_SIZE_PX = 512;

export const CROSSVIEW_WARP_NODE_IDS = {
  depthModel: "41",
  depth: "42",
  warp: "43"
} as const;

export const buildCrossviewWarpNodes = ({
  sourceFrames,
  camera
}: {
  sourceFrames: [nodeId: string, outputIndex: number];
  camera: MiniMaxH3CrossviewCamera;
}): ComfyGraph => ({
  [CROSSVIEW_WARP_NODE_IDS.depthModel]: {
    class_type: "LoadMoGeModel",
    inputs: { model_name: CROSSVIEW_DEPTH_MODEL_FILE }
  },
  [CROSSVIEW_WARP_NODE_IDS.depth]: {
    class_type: "MoGeInference",
    inputs: {
      moge_model: [CROSSVIEW_WARP_NODE_IDS.depthModel, 0],
      image: sourceFrames,
      resolution_level: DEPTH_RESOLUTION_LEVEL,
      fov_x_degrees: 0,
      batch_size: DEPTH_BATCH_SIZE,
      force_projection: true,
      apply_mask: true,
      refine_steps: 0
    }
  },
  [CROSSVIEW_WARP_NODE_IDS.warp]: {
    class_type: "CrossViewWarp",
    inputs: {
      frames: sourceFrames,
      moge_geometry: [CROSSVIEW_WARP_NODE_IDS.depth, 0],
      azimuth: camera.azimuthDegrees,
      elevation: camera.elevationDegrees,
      distance: 1,
      hfov: ASSUMED_HORIZONTAL_FIELD_OF_VIEW_DEGREES,
      vertical_shift: 0,
      depth_ratio: SCENE_DEPTH_RATIO,
      smooth_depth: false,
      invert_depth: false,
      roll_lock: true,
      pivot_override: false,
      pivot_x: 0,
      pivot_y: 0,
      pivot_z: 1.05,
      use_keyframes: false,
      frame_count: 0,
      keyframes: "",
      interp_motion: "linear",
      interpolation: "linear",
      keep_source_aim: false,
      preview_size: LIVE_PREVIEW_SIZE_PX,
      frame_index: 1
    }
  }
});
