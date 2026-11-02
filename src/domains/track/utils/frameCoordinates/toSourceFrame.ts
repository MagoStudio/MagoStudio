export const toSourceFrame = ({
  outputFrame,
  offset
}: {
  outputFrame: number;
  offset: number;
}): number => outputFrame + offset;
