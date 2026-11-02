import { ceilToPrecision, floorToPrecision } from "@utils";

export const MIN_TRIM_RANGE = 1;
export const MAX_TRIM_RANGE = 59;

interface TrimConstraints {
  videoDuration: number;
  currentMin: number;
  currentMax: number;
}

export function adjustTrimOnMinChange(
  newMin: number,
  constraints: TrimConstraints
): { min: number; max: number } {
  const { currentMax } = constraints;
  const flooredValue = floorToPrecision(newMin);

  const minAllowed = 0;
  const maxAllowedByMinRange = currentMax - MIN_TRIM_RANGE;
  const minAllowedByMaxRange = Math.max(0, currentMax - MAX_TRIM_RANGE);
  const maxAllowed = maxAllowedByMinRange;
  const minAllowedFinal = Math.max(minAllowed, minAllowedByMaxRange);
  const validatedMin = Math.max(
    minAllowedFinal,
    Math.min(maxAllowed, flooredValue)
  );

  return {
    min: validatedMin,
    max: currentMax
  };
}

export function adjustTrimOnMaxChange(
  newMax: number,
  constraints: TrimConstraints
): { min: number; max: number } {
  const { videoDuration, currentMin } = constraints;
  const ceiledValue = ceilToPrecision(newMax);

  const minAllowedByMinRange = currentMin + MIN_TRIM_RANGE;
  const maxAllowedByDuration = videoDuration;
  const maxAllowedByMaxRange = currentMin + MAX_TRIM_RANGE;
  const minAllowed = minAllowedByMinRange;
  const maxAllowed = Math.min(maxAllowedByDuration, maxAllowedByMaxRange);
  const validatedMax = Math.max(minAllowed, Math.min(maxAllowed, ceiledValue));

  return {
    min: currentMin,
    max: validatedMax
  };
}
