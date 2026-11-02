export const toOutputFrame = ({
  sourceFrame,
  offset
}: {
  sourceFrame: number;
  offset: number;
}): number => Math.max(0, sourceFrame - offset);
