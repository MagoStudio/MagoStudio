import {
  normalizeSourceVideoTrim,
  SourceVideoTrim
} from "./normalizeSourceVideoTrim";

const MILLISECONDS_PER_SECOND = 1000;
const UNTRIMMED_SOURCE_VIDEO_TRIM_KEY = "full";
const OPEN_TRIM_END_LABEL = "end";

const toWholeMilliseconds = (seconds: number): number =>
  Math.round(seconds * MILLISECONDS_PER_SECOND);

export const toSourceVideoTrimKey = (trim: SourceVideoTrim): string => {
  const { trimStartSeconds, trimEndSeconds } = normalizeSourceVideoTrim(trim);
  const isSourceVideoTrimmed =
    trimStartSeconds !== undefined || trimEndSeconds !== undefined;
  if (!isSourceVideoTrimmed) return UNTRIMMED_SOURCE_VIDEO_TRIM_KEY;
  const trimStartLabel = String(toWholeMilliseconds(trimStartSeconds ?? 0));
  const trimEndLabel =
    trimEndSeconds === undefined
      ? OPEN_TRIM_END_LABEL
      : String(toWholeMilliseconds(trimEndSeconds));
  return `${trimStartLabel}-${trimEndLabel}`;
};
