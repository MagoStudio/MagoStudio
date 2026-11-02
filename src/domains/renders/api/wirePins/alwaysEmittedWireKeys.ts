export const alwaysEmittedWireKeys = ({
  frameRange,
  convertExrsToPngs
}: {
  frameRange: number[];
  convertExrsToPngs: boolean;
}): { frame_range: number[]; convert_exrs_to_pngs: boolean } => ({
  frame_range: frameRange,
  convert_exrs_to_pngs: convertExrsToPngs
});
