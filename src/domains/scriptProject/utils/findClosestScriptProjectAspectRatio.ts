import { SCRIPT_PROJECT_ASPECT_RATIOS } from "../constants";

export type ScriptProjectAspectRatio =
  (typeof SCRIPT_PROJECT_ASPECT_RATIOS)[number];

const ratioDistance = (firstRatio: number, secondRatio: number): number =>
  Math.abs(Math.log(firstRatio / secondRatio));

export const findClosestScriptProjectAspectRatio = ([widthPx, heightPx]: [
  number,
  number
]): ScriptProjectAspectRatio => {
  const outputRatio = widthPx / heightPx;
  return SCRIPT_PROJECT_ASPECT_RATIOS.reduce((closest, candidate) =>
    ratioDistance(candidate.widthUnits / candidate.heightUnits, outputRatio) <
    ratioDistance(closest.widthUnits / closest.heightUnits, outputRatio)
      ? candidate
      : closest
  );
};
