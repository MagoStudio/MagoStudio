import {
  EngineFamily,
  getEngineFamily
} from "@domains/renders/utils/getEngineFamily";
import { VideoEngine } from "@models/video/types";

import type { Tool } from "./parseTool";

const TOOL_BY_ENGINE_FAMILY: Record<EngineFamily, Tool> = {
  render: "render-video",
  upscale: "upscale",
  mask: "mask",
  "image-to-video": "image-to-video"
};

export const getToolForEngine = (engine: VideoEngine | undefined): Tool =>
  TOOL_BY_ENGINE_FAMILY[getEngineFamily(engine)];
