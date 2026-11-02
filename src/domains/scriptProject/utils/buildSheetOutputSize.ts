import {
  DEFAULT_ASPECT_RATIO_ID,
  SCRIPT_PROJECT_ASPECT_RATIOS,
  SheetResolution
} from "../constants";

const DIMENSION_STEP_PX = 8;
const BASE_SHEET_EDGE_PX = 1024;
const SHEET_AREA_BY_RESOLUTION: Record<SheetResolution, number> = {
  "1m": BASE_SHEET_EDGE_PX * BASE_SHEET_EDGE_PX,
  "2m": 2 * BASE_SHEET_EDGE_PX * BASE_SHEET_EDGE_PX
};

export const resolveSheetResolution = (
  storedResolution: unknown
): SheetResolution => (storedResolution === "2m" ? "2m" : "1m");

/** Sheet tiers specify area; the video's canvas supplies only the locked aspect. */
export const buildSheetOutputSize = (
  outputSize: [number, number],
  resolution: SheetResolution
): [number, number] => {
  const defaultRatio = SCRIPT_PROJECT_ASPECT_RATIOS.find(
    (ratio) => ratio.id === DEFAULT_ASPECT_RATIO_ID
  )!;
  const aspect =
    outputSize[0] > 0 && outputSize[1] > 0
      ? outputSize[0] / outputSize[1]
      : defaultRatio.widthUnits / defaultRatio.heightUnits;
  const ratio = SCRIPT_PROJECT_ASPECT_RATIOS.reduce((nearest, candidate) =>
    Math.abs(candidate.widthUnits / candidate.heightUnits - aspect) <
    Math.abs(nearest.widthUnits / nearest.heightUnits - aspect)
      ? candidate
      : nearest
  );
  const snappedAspect = ratio.widthUnits / ratio.heightUnits;
  const area = SHEET_AREA_BY_RESOLUTION[resolution];
  const roundToStep = (value: number) =>
    Math.max(1, Math.round(value / DIMENSION_STEP_PX)) * DIMENSION_STEP_PX;
  return [
    roundToStep(Math.sqrt(area * snappedAspect)),
    roundToStep(Math.sqrt(area / snappedAspect))
  ];
};
