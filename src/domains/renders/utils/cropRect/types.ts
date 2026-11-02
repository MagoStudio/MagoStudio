export interface NormalizedCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AbsoluteCropRect {
  topLeft: [number, number];
  bottomRight: [number, number];
}
