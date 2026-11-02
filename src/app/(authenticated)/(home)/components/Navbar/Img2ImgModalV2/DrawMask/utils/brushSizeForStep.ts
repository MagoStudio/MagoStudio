export const BRUSH_MIN_STEP = 1;
export const BRUSH_MAX_STEP = 20;
export const BRUSH_MIN_PX = 10;
export const BRUSH_MAX_PX = 184;
export const BRUSH_DEFAULT_STEP = 7;

export const brushSizeForStep = (step: number): number => {
  const clamped = Math.min(BRUSH_MAX_STEP, Math.max(BRUSH_MIN_STEP, step));
  return (
    BRUSH_MIN_PX +
    ((BRUSH_MAX_PX - BRUSH_MIN_PX) * (clamped - BRUSH_MIN_STEP)) /
      (BRUSH_MAX_STEP - BRUSH_MIN_STEP)
  );
};
