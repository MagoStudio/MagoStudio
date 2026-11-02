import { useImageAssets } from "@domains/asset/useImageAssets";
import { getAssetDimensions } from "@domains/asset/utils/getAssetDimensions";
import { VideoEngine } from "@models/video/types";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";

const IMAGE_DIMENSION_VALIDATED_MODELS: VideoEngine[] = [
  VideoEngine.kling_o1,
  VideoEngine.kling_2_6_motion_control,
  VideoEngine.kling_3_motion_control
];

export const useRenderImageDimensions = ():
  | Array<{ width: number; height: number }>
  | undefined => {
  const { selectedModelAtom, sourcesAtom } = useRenderSettingsAtoms();
  const selectedModel = useAtomValue(selectedModelAtom);
  const sources = useAtomValue(sourcesAtom);

  const referencedImageIds = sources
    .map((entry) => entry.asset_id)
    .filter((id): id is string => Boolean(id));

  const { data: imageAssets } = useImageAssets({
    assetIds: referencedImageIds,
    enabled:
      referencedImageIds.length > 0 &&
      IMAGE_DIMENSION_VALIDATED_MODELS.includes(selectedModel.name)
  });

  const imageDimensions = imageAssets
    ?.map((asset) => {
      const { width, height } = getAssetDimensions(asset?.asset?.data);
      return { width: width ?? 0, height: height ?? 0 };
    })
    .filter((dimensions) => dimensions.width > 0 && dimensions.height > 0);

  return imageDimensions && imageDimensions.length > 0
    ? imageDimensions
    : undefined;
};
