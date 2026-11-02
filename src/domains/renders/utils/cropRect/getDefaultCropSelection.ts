import { NormalizedCropRect } from "./types";

export const getDefaultCropSelection = (): NormalizedCropRect => ({
  x: 0.25,
  y: 0.25,
  width: 0.5,
  height: 0.5
});
