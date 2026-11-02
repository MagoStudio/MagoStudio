import { useImageAsset } from "@domains/asset/useImageAsset";
import { imageUrlToBase64 } from "@domains/asset/utils/imageUrlToBase64";
import { useQuery } from "@tanstack/react-query";

const CACHE_TIME_MINUTES = 30;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MINUTES_TO_MILLISECONDS = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

interface UseExtractImageAsBase64Props {
  imageAssetId?: string;
  enabled?: boolean;
  resizeToMaxDimension?: number;
}

export const useGetImageAsBase64 = ({
  imageAssetId,
  enabled = true,
  resizeToMaxDimension
}: UseExtractImageAsBase64Props) => {
  const { data: imageAsset } = useImageAsset({
    assetId: imageAssetId,
    enabled: !!imageAssetId && enabled
  });

  const imageUrl = imageAsset?.urlToUse;

  return useQuery({
    queryKey: ["imageBase64", imageUrl, resizeToMaxDimension ?? "full-size"],
    queryFn: async () => {
      if (!imageUrl) return null;
      return imageUrlToBase64(imageUrl, resizeToMaxDimension);
    },
    enabled: !!imageUrl && enabled,
    staleTime: Infinity,
    gcTime: CACHE_TIME_MINUTES * MINUTES_TO_MILLISECONDS
  });
};
