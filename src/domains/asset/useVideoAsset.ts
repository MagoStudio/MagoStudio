import { useGetVideoAsset } from "./data/useGetVideoAsset";

export const useVideoAsset = ({
  assetId,
  selectedLayerId,
  enabled = true,
  priority
}: {
  assetId?: string;
  selectedLayerId?: string;
  enabled?: boolean;
  priority?: number;
  projectId?: string;
  shotId?: string;
  layerId?: string;
}) => {
  return useGetVideoAsset({
    assetId,
    selectedLayerId,
    enabled,
    priority
  });
};
