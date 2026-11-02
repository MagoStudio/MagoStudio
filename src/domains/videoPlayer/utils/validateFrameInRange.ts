export function validateFrameInRange(
  frame: number,
  start: number,
  end: number
): boolean {
  if (start === Infinity || end === -Infinity) {
    return false;
  }

  return frame >= start && frame <= end;
}

export function clampFrameToRange(
  frame: number,
  start: number,
  end: number
): number {
  if (start === Infinity || end === -Infinity) {
    return 0;
  }

  if (frame < start) return start;
  if (frame > end) return end;
  return frame;
}
