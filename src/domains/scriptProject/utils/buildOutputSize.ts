import {
  DEFAULT_ASPECT_RATIO_ID,
  DEFAULT_RESOLUTION_ID,
  SCRIPT_PROJECT_ASPECT_RATIOS,
  SCRIPT_PROJECT_RESOLUTIONS,
  ScriptProjectAspectRatioId,
  ScriptProjectResolutionId
} from "../constants";

/** Render sizes must be a multiple of this; models reject or silently pad odd dimensions. */
const DIMENSION_STEP_PX = 8;

/** The floor is one STEP, not one pixel-count: `Math.max` here compares a step count, so
 * guarding with `DIMENSION_STEP_PX` set the minimum edge to 64px and silently inflated anything
 * under 60px. Unreachable while the smallest resolution has a 480px short edge, but the
 * resolution list is data and one new entry would have reached it. */
const MINIMUM_DIMENSION_STEPS = 1;

const roundToStep = (value: number): number =>
  Math.max(MINIMUM_DIMENSION_STEPS, Math.round(value / DIMENSION_STEP_PX)) *
  DIMENSION_STEP_PX;

export const buildOutputSize = (
  aspectRatioId: ScriptProjectAspectRatioId,
  resolutionId: ScriptProjectResolutionId
): [number, number] => {
  const ratio =
    SCRIPT_PROJECT_ASPECT_RATIOS.find((item) => item.id === aspectRatioId) ??
    SCRIPT_PROJECT_ASPECT_RATIOS[0];
  const resolution =
    SCRIPT_PROJECT_RESOLUTIONS.find((item) => item.id === resolutionId) ??
    SCRIPT_PROJECT_RESOLUTIONS.find(
      (item) => item.id === DEFAULT_RESOLUTION_ID
    ) ??
    SCRIPT_PROJECT_RESOLUTIONS[0];

  const shortEdgeUnits = Math.min(ratio.widthUnits, ratio.heightUnits);
  const pixelsPerUnit = resolution.shortEdgePx / shortEdgeUnits;

  return [
    roundToStep(ratio.widthUnits * pixelsPerUnit),
    roundToStep(ratio.heightUnits * pixelsPerUnit)
  ];
};

export const DEFAULT_OUTPUT_SIZE = buildOutputSize(
  DEFAULT_ASPECT_RATIO_ID,
  DEFAULT_RESOLUTION_ID
);

/** Which pair of controls produced this size, so the dropdowns can show the saved choice. */
export const matchOutputSize = (
  outputSize: [number, number] | undefined
): {
  aspectRatioId: ScriptProjectAspectRatioId;
  resolutionId: ScriptProjectResolutionId;
} => {
  for (const ratio of SCRIPT_PROJECT_ASPECT_RATIOS) {
    for (const resolution of SCRIPT_PROJECT_RESOLUTIONS) {
      const [width, height] = buildOutputSize(ratio.id, resolution.id);
      if (outputSize?.[0] === width && outputSize[1] === height) {
        return { aspectRatioId: ratio.id, resolutionId: resolution.id };
      }
    }
  }

  if (!outputSize || outputSize[0] <= 0 || outputSize[1] <= 0) {
    return {
      aspectRatioId: DEFAULT_ASPECT_RATIO_ID,
      resolutionId: DEFAULT_RESOLUTION_ID
    };
  }
  const aspect = outputSize[0] / outputSize[1];
  const ratio = SCRIPT_PROJECT_ASPECT_RATIOS.reduce((nearest, candidate) =>
    Math.abs(candidate.widthUnits / candidate.heightUnits - aspect) <
    Math.abs(nearest.widthUnits / nearest.heightUnits - aspect)
      ? candidate
      : nearest
  );
  const shortEdge = Math.min(...outputSize);
  const resolution = SCRIPT_PROJECT_RESOLUTIONS.reduce((nearest, candidate) =>
    Math.abs(candidate.shortEdgePx - shortEdge) <
    Math.abs(nearest.shortEdgePx - shortEdge)
      ? candidate
      : nearest
  );
  return { aspectRatioId: ratio.id, resolutionId: resolution.id };
};
