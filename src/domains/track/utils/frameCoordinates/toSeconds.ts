export const toSeconds = ({
  outputFrame,
  fps
}: {
  outputFrame: number;
  fps: number;
}): number => outputFrame / fps;
