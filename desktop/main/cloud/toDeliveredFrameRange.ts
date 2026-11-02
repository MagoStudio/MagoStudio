const isFrameRange = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((frame) => typeof frame === "number" && Number.isInteger(frame));

export const toDeliveredFrameRange = (
  registeredFrameRange: unknown,
  deliveredFrameCount: number
): [number, number] | null => {
  if (!isFrameRange(registeredFrameRange)) return null;
  const [firstFrame] = registeredFrameRange;
  return [firstFrame, firstFrame + deliveredFrameCount - 1];
};
