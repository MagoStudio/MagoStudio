interface AssetDataWithDimensions {
  width?: number;
  height?: number;
  size?: [number, number];
}

interface AssetDimensions {
  width: number | undefined;
  height: number | undefined;
}

export const getAssetDimensions = (
  data: AssetDataWithDimensions | undefined | null
): AssetDimensions => {
  if (!data) {
    return { width: undefined, height: undefined };
  }

  return {
    width: data.width ?? data.size?.[0],
    height: data.height ?? data.size?.[1]
  };
};
