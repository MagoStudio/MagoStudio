import {
  SELECTABLE_SHOT_RENDER_ENGINES,
  SelectableShotRenderEngine
} from "../constants";

export const isSelectableShotRenderEngine = (
  value: unknown
): value is SelectableShotRenderEngine =>
  typeof value === "string" &&
  SELECTABLE_SHOT_RENDER_ENGINES.includes(value as SelectableShotRenderEngine);
