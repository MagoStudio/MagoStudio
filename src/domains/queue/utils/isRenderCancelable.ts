import { AssetStatus } from "@schemas/asset";

interface Args {
  status: AssetStatus | undefined;
  positionInQueue: number | undefined;
}

export const isRenderCancelable = ({
  status,
  positionInQueue
}: Args): boolean => {
  if (status !== AssetStatus.PENDING) return false;
  return positionInQueue !== 0;
};
