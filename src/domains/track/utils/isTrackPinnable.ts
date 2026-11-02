import { AssetStatus } from "@schemas/asset";

export const isTrackPinnable = (status: AssetStatus | undefined): boolean =>
  status === AssetStatus.FINISHED;
