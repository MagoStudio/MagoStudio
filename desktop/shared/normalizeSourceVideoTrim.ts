export interface SourceVideoTrim {
  trimStartSeconds?: number;
  trimEndSeconds?: number;
}

const MILLISECONDS_PER_SECOND = 1000;

const roundToWholeMilliseconds = (seconds: number): number =>
  Math.round(seconds * MILLISECONDS_PER_SECOND) / MILLISECONDS_PER_SECOND;

export const normalizeSourceVideoTrim = (
  trim: SourceVideoTrim
): SourceVideoTrim => {
  const trimStartSeconds =
    trim.trimStartSeconds === undefined
      ? undefined
      : roundToWholeMilliseconds(trim.trimStartSeconds);
  const trimEndSeconds =
    trim.trimEndSeconds === undefined
      ? undefined
      : roundToWholeMilliseconds(trim.trimEndSeconds);
  const isTrimStartAtSourceStart =
    trimStartSeconds === undefined || trimStartSeconds === 0;
  return {
    ...(isTrimStartAtSourceStart ? {} : { trimStartSeconds }),
    ...(trimEndSeconds === undefined ? {} : { trimEndSeconds })
  };
};
