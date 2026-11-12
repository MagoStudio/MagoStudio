import { CutShotVersion, ProjectCut } from "@schemas/scriptProject";

import {
  UNRECORDED_RENDER_SHOT_RENDER_ENGINE,
  SHOT_RENDER_ENGINES,
  ShotRenderEngine
} from "../constants";

import { estimateShotRenderCredits } from "./estimateShotRenderCredits";
import { readOutputSize } from "./readOutputSize";
import { SHOT_FPS, snapShotSecondsToFrames } from "./snapShotFrames";

const COMPLETED_VERSION_STATUSES = ["success", "available", "finished"];

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readShotRenderEngine = (value: unknown): ShotRenderEngine =>
  SHOT_RENDER_ENGINES.find((engine) => engine === value) ??
  UNRECORDED_RENDER_SHOT_RENDER_ENGINE;

const readDurationSeconds = (
  renderSpec: Record<string, unknown>
): number | null => {
  const nestedSettings = readRecord(renderSpec.settings);
  const explicitSeconds = renderSpec.duration_s ?? nestedSettings?.duration_s;
  if (typeof explicitSeconds === "number" && explicitSeconds > 0) {
    return explicitSeconds;
  }
  const frameRange = renderSpec.frame_range ?? nestedSettings?.frame_range;
  if (
    Array.isArray(frameRange) &&
    typeof frameRange[0] === "number" &&
    typeof frameRange[1] === "number" &&
    frameRange[1] >= frameRange[0]
  ) {
    return (frameRange[1] - frameRange[0] + 1) / SHOT_FPS;
  }
  return null;
};

const countReferenceImages = (
  renderSpec: Record<string, unknown> | null
): number =>
  Object.values(readRecord(renderSpec?.references) ?? {}).reduce<number>(
    (referenceCount, references) =>
      referenceCount + (Array.isArray(references) ? references.length : 0),
    0
  );

const isVersionCompleted = (version: CutShotVersion): boolean =>
  version.ready ||
  !!version.url ||
  COMPLETED_VERSION_STATUSES.includes(version.status.toLowerCase());

export const estimateRenderedVideoCredits = (
  cut: ProjectCut | undefined
): number => {
  const pricedAssetIds = new Set<string>();
  let credits = 0;
  for (const shot of [...(cut?.shots ?? []), ...(cut?.hidden_shots ?? [])]) {
    for (const version of shot.versions) {
      if (
        pricedAssetIds.has(version.asset_id) ||
        version.timeline_upscale_of ||
        !isVersionCompleted(version)
      ) {
        continue;
      }
      const renderSpec = readRecord(version.render_spec);
      const inputSettings = readRecord(version.input_settings);
      const outputSize =
        readOutputSize(renderSpec) ?? readOutputSize(inputSettings);
      const durationSeconds =
        (renderSpec ? readDurationSeconds(renderSpec) : null) ??
        (inputSettings ? readDurationSeconds(inputSettings) : null);
      if (!outputSize || !durationSeconds) continue;
      const engineSettings =
        readRecord(renderSpec?.settings) ?? renderSpec ?? inputSettings;
      pricedAssetIds.add(version.asset_id);
      credits += estimateShotRenderCredits({
        shotEngine: readShotRenderEngine(engineSettings?.engine),
        outputSize,
        shotFrames: snapShotSecondsToFrames(durationSeconds),
        referenceImageSizes: Array.from(
          { length: countReferenceImages(renderSpec) },
          () => null
        )
      });
    }
  }
  return credits;
};
