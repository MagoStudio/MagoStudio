export type RulerUnitMode = "seconds" | "frames";

export type RulerTick = {
  frame: number;
  x: number;
  kind: "major" | "minor";
  label?: string;
};

const DEFAULT_FPS = 24;
const MAX_MAJOR_TICKS = 11;
const MIN_PX_BETWEEN_TICKS = 2;
const MIN_PX_BETWEEN_LABELS = 18;
const SMALL_TICKS_BETWEEN_MAJOR = 4;
const EPS = 1e-6;
const BASE_10 = 10;
const ONE_DECIMAL_FACTOR = 10;
const SECONDS_SNAP_EPS = 0.05;
const CEIL_STEP_MULTIPLIER_2 = 2;
const CEIL_STEP_MULTIPLIER_5 = 5;
const CEIL_STEP_MULTIPLIER_10 = 10;

function getCeilStepMultiplierFromScaledValue(scaled: number): number {
  let stepMultiplier = 1;
  if (scaled <= 1) {
    stepMultiplier = 1;
  } else if (scaled <= CEIL_STEP_MULTIPLIER_2) {
    stepMultiplier = CEIL_STEP_MULTIPLIER_2;
  } else if (scaled <= CEIL_STEP_MULTIPLIER_5) {
    stepMultiplier = CEIL_STEP_MULTIPLIER_5;
  } else {
    stepMultiplier = CEIL_STEP_MULTIPLIER_10;
  }
  return stepMultiplier;
}

function ceilToCleanStep(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const exp = Math.pow(BASE_10, Math.floor(Math.log10(value)));
  const scaled = value / exp;
  const stepMultiplier = getCeilStepMultiplierFromScaledValue(scaled);
  return stepMultiplier * exp;
}

function formatSecondsLabel(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0";
  const rounded = Math.round(seconds);
  if (Math.abs(seconds - rounded) < SECONDS_SNAP_EPS) return rounded.toString();
  const value = Math.round(seconds * ONE_DECIMAL_FACTOR) / ONE_DECIMAL_FACTOR;
  return value.toString();
}

function formatFrameLabel(frames: number): string {
  const rounded = Math.round(frames);
  return rounded.toString() + "f";
}

export function getRulerUnitMode({
  durationFrames: _durationFrames,
  fps: _fps
}: {
  durationFrames: number;
  fps: number;
}): RulerUnitMode {
  return "frames";
}

function getMajorStepSeconds(durationSeconds: number): number {
  const rawStep = durationSeconds / (MAX_MAJOR_TICKS - 1);
  return Math.max(1, ceilToCleanStep(rawStep));
}

function getMajorStepFrames(durationFrames: number): number {
  const rawStep = durationFrames / (MAX_MAJOR_TICKS - 1);
  return ceilToCleanStep(rawStep);
}

export function generateRulerTicks({
  durationFrames,
  fps,
  widthPx,
  mode
}: {
  durationFrames: number;
  fps: number;
  widthPx: number;
  mode: RulerUnitMode;
}): RulerTick[] {
  const maxFrames = Math.max(0, durationFrames);
  if (maxFrames === 0 || widthPx <= 0) return [];

  const safeFps = fps > 0 ? fps : DEFAULT_FPS;
  const durationSeconds = maxFrames / safeFps;

  const majorStepUnit =
    mode === "seconds"
      ? getMajorStepSeconds(durationSeconds)
      : getMajorStepFrames(maxFrames);

  const majorStepFrames =
    mode === "seconds" ? majorStepUnit * safeFps : majorStepUnit;

  const endOnMajorBoundary =
    mode === "seconds"
      ? Math.abs(
          durationSeconds / majorStepUnit -
            Math.round(durationSeconds / majorStepUnit)
        ) < EPS
      : Math.abs(
          maxFrames / majorStepUnit - Math.round(maxFrames / majorStepUnit)
        ) < EPS;

  const frameToX = (frame: number) => (frame / maxFrames) * widthPx;

  const ticks: RulerTick[] = [];

  const majorFrames: number[] = [];

  if (mode === "seconds") {
    const maxWholeSecondIndex = Math.floor(durationSeconds / majorStepUnit);
    for (let i = 0; i <= maxWholeSecondIndex; i++) {
      majorFrames.push(i * majorStepUnit * safeFps);
    }
  } else {
    const maxMajorIndex = Math.floor(maxFrames / majorStepUnit);
    for (let i = 0; i <= maxMajorIndex; i++) {
      majorFrames.push(i * majorStepUnit);
    }
  }

  if (
    endOnMajorBoundary &&
    (majorFrames.length === 0 ||
      majorFrames[majorFrames.length - 1] !== maxFrames)
  ) {
    majorFrames.push(maxFrames);
  }

  const uniqueMajorFrames = Array.from(new Set(majorFrames))
    .map((f) => Math.max(0, Math.min(f, maxFrames)))
    .sort((a, b) => a - b);

  let lastTickX = -Infinity;
  let lastLabelX = -Infinity;

  for (let idx = 0; idx < uniqueMajorFrames.length; idx++) {
    const startFrame = uniqueMajorFrames[idx];
    const startX = frameToX(startFrame);
    const isMaxFrameTick = Math.abs(startFrame - maxFrames) < EPS;
    const kind: RulerTick["kind"] =
      isMaxFrameTick && !endOnMajorBoundary ? "minor" : "major";

    if (startX > lastTickX + MIN_PX_BETWEEN_TICKS) {
      const label =
        mode === "seconds"
          ? formatSecondsLabel(startFrame / safeFps)
          : formatFrameLabel(startFrame);

      const shouldRenderLabel =
        startX > lastLabelX + MIN_PX_BETWEEN_LABELS &&
        (!isMaxFrameTick || endOnMajorBoundary);
      ticks.push({
        kind,
        frame: startFrame,
        x: startX,
        label: kind === "major" && shouldRenderLabel ? label : undefined
      });
      lastTickX = startX;
      if (shouldRenderLabel) lastLabelX = startX;
    }

    const minorStepFrames = majorStepFrames / (SMALL_TICKS_BETWEEN_MAJOR + 1);
    if (!Number.isFinite(minorStepFrames) || minorStepFrames <= 0) continue;

    for (let j = 1; j <= SMALL_TICKS_BETWEEN_MAJOR; j++) {
      const f = startFrame + minorStepFrames * j;
      if (f >= maxFrames) break;

      const x = frameToX(f);
      if (x > lastTickX + MIN_PX_BETWEEN_TICKS) {
        ticks.push({ kind: "minor", frame: f, x });
        lastTickX = x;
      }
    }
  }

  return ticks;
}
