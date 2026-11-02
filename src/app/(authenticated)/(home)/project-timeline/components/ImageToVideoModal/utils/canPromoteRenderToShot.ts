import { AssetStatus } from "@schemas/asset";

export const canPromoteRenderToShot = ({
  status,
  hasOutputAsset
}: {
  status: AssetStatus | undefined;
  hasOutputAsset: boolean;
}): boolean => status === AssetStatus.FINISHED && hasOutputAsset;
