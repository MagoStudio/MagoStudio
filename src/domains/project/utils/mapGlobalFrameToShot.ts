export interface ShotFrameMapping {
  shotIndex: number;
  localFrame: number;
}

export function mapGlobalFrameToShot(
  globalFrame: number,
  cumulativeStartFrames: number[],
  shotDurations: number[]
): ShotFrameMapping {
  if (cumulativeStartFrames.length === 0) {
    return { shotIndex: 0, localFrame: 0 };
  }

  const clampedFrame = Math.max(0, globalFrame);

  let low = 0;
  let high = cumulativeStartFrames.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (cumulativeStartFrames[mid] <= clampedFrame) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  const shotIndex = low;
  const localFrame = Math.min(
    clampedFrame - cumulativeStartFrames[shotIndex],
    shotDurations[shotIndex] - 1
  );

  return { shotIndex, localFrame: Math.max(0, localFrame) };
}
