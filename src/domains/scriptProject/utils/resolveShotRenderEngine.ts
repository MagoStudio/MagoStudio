import {
  NEW_PROJECT_SHOT_RENDER_ENGINE,
  SHOT_RENDER_ENGINES,
  ShotRenderEngine,
  UNRECORDED_RENDER_SHOT_RENDER_ENGINE
} from "../constants";

import { isSelectableShotRenderEngine } from "./isSelectableShotRenderEngine";

export const resolveShotRenderEngine = (
  storedEngine: unknown,
  origin: "local" | "cloud" | undefined
): ShotRenderEngine => {
  if (origin === "local")
    return SHOT_RENDER_ENGINES.includes(storedEngine as ShotRenderEngine)
      ? (storedEngine as ShotRenderEngine)
      : UNRECORDED_RENDER_SHOT_RENDER_ENGINE;
  return isSelectableShotRenderEngine(storedEngine)
    ? storedEngine
    : NEW_PROJECT_SHOT_RENDER_ENGINE;
};
