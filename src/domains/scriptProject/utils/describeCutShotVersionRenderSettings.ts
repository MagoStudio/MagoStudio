import { CutShotVersion } from "@schemas/scriptProject";

import {
  SHOT_RENDER_SPEED_LABEL_KEY_BY_ENGINE,
  ShotRenderEngine
} from "../constants";

export type CutShotVersionRenderSettingsDescription = {
  engineLabelKey: string | undefined;
  qualityLabel: string | undefined;
};

const isShotRenderEngine = (engine: unknown): engine is ShotRenderEngine =>
  typeof engine === "string" &&
  Object.hasOwn(SHOT_RENDER_SPEED_LABEL_KEY_BY_ENGINE, engine);

const isOutputSize = (outputSize: unknown): outputSize is [number, number] =>
  Array.isArray(outputSize) &&
  outputSize.length === 2 &&
  outputSize.every(
    (sidePx) =>
      typeof sidePx === "number" && Number.isFinite(sidePx) && sidePx > 0
  );

export const describeCutShotVersionRenderSettings = (
  version: Pick<CutShotVersion, "render_spec">
): CutShotVersionRenderSettingsDescription => {
  const renderSettings = version.render_spec?.settings;
  const engine =
    renderSettings && typeof renderSettings === "object"
      ? (renderSettings as Record<string, unknown>).engine
      : undefined;
  const outputSize = version.render_spec?.output_size;
  return {
    engineLabelKey: isShotRenderEngine(engine)
      ? SHOT_RENDER_SPEED_LABEL_KEY_BY_ENGINE[engine]
      : undefined,
    qualityLabel: isOutputSize(outputSize)
      ? `${Math.min(...outputSize)}p`
      : undefined
  };
};
