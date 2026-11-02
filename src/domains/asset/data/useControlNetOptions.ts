import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { Layer } from "@schemas/layer";

import { VideoAssetIngestionSuccess } from "../api/interface";
import {
  getControlNetOptions,
  ControlNetOption
} from "../utils/controlNetHelpers";

import { useGetVideoAsset } from "./useGetVideoAsset";

export const useControlNetOptions = ({
  track,
  enabled = true
}: {
  track: Layer | undefined;
  enabled?: boolean;
}): {
  options: ControlNetOption[];
  controlNets:
    | Array<{
        name: string;
        video: string;
      }>
    | undefined;
  isLoading: boolean;
  error: Error | null;
} => {
  const assetId = getTrackAssetId(track);
  const selectedLayerId = track?.id;
  const {
    data: videoAssetResponse,
    isLoading,
    error
  } = useGetVideoAsset({
    assetId,
    selectedLayerId,
    enabled
  });
  const processedData = (() => {
    const videoAsset = (
      videoAssetResponse as VideoAssetIngestionSuccess | undefined
    )?.asset;

    const availableControlNets = videoAsset?.manifest?.controlNets;
    const options = getControlNetOptions(availableControlNets);

    return {
      options,
      controlNets: availableControlNets
    };
  })();
  return {
    ...processedData,
    isLoading,
    error
  };
};
