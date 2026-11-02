import { AssetStatus } from "@schemas/asset";

export const canDownloadRenderVideo = ({
  status,
  hasOutputAsset
}: {
  status: AssetStatus | undefined;
  hasOutputAsset: boolean;
}): boolean => status === AssetStatus.FINISHED && hasOutputAsset;
