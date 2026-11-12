import { ProjectCut } from "@schemas/scriptProject";

import { MINIMAX_H3_MAX_SHOT_RENDER_ENGINE } from "../constants";

import { estimateShotRenderCredits } from "./estimateShotRenderCredits";
import { snapShotSecondsToFrames } from "./snapShotFrames";

const VIDEO_FRAMES_PER_SECOND = 24;

const recordValue = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const positiveNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;

const requestedDuration = (
  settings: Record<string, unknown> | null | undefined
): number | null => {
  const direct =
    positiveNumber(settings?.duration_s) ??
    positiveNumber(recordValue(settings?.settings)?.duration_s);
  if (direct) return direct;
  const nested = recordValue(settings?.settings);
  const range = settings?.frame_range ?? nested?.frame_range;
  return Array.isArray(range) &&
    range.length === 2 &&
    typeof range[0] === "number" &&
    typeof range[1] === "number" &&
    range[1] >= range[0]
    ? (range[1] - range[0] + 1) / VIDEO_FRAMES_PER_SECOND
    : null;
};

const requestedOutputSize = (
  settings: Record<string, unknown> | null | undefined
): [number, number] | null => {
  const size = settings?.output_size;
  if (!Array.isArray(size) || size.length !== 2) return null;
  const width = positiveNumber(size[0]);
  const height = positiveNumber(size[1]);
  return width && height ? [width, height] : null;
};

const referenceImageCount = (
  settings: Record<string, unknown> | null
): number => {
  const references = recordValue(settings?.references);
  return references
    ? Object.values(references).reduce<number>(
        (count, value) => count + (Array.isArray(value) ? value.length : 0),
        0
      )
    : 0;
};

/** Values completed local generations with the Mago Cloud H3 Max FE formula. */
export const estimateLocalMagoCloudCredits = (
  cut: ProjectCut | undefined
): number => {
  const countedAssets = new Set<string>();
  let credits = 0;
  for (const shot of [...(cut?.shots ?? []), ...(cut?.hidden_shots ?? [])]) {
    for (const version of shot.versions) {
      if (
        countedAssets.has(version.asset_id) ||
        version.timeline_upscale_of ||
        (!version.ready &&
          !version.url &&
          version.status.toLowerCase() !== "success" &&
          version.status.toLowerCase() !== "available")
      ) {
        continue;
      }
      const primary = recordValue(version.render_spec);
      const fallback = recordValue(version.input_settings);
      const duration =
        requestedDuration(primary) ?? requestedDuration(fallback);
      const outputSize =
        requestedOutputSize(primary) ?? requestedOutputSize(fallback);
      if (!duration || !outputSize) continue;
      countedAssets.add(version.asset_id);
      credits += estimateShotRenderCredits({
        shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
        outputSize,
        shotFrames: snapShotSecondsToFrames(duration),
        referenceImageSizes: Array.from(
          { length: referenceImageCount(primary) },
          () => null
        )
      });
    }
  }
  return credits;
};
