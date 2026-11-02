import { isScaleFactorSizedVideoModel } from "@domains/renders/utils/isScaleFactorSizedVideoModel";
import { VideoEngine } from "@models/video/types";
interface RenderSettings {
  mago_engine?: VideoEngine;
  upscale_scale_factor?: string | number;
  width?: number;
  height?: number;
  max_size?: number;
  output_size?: [number, number];
}

export const getOutputBiggestSide = (
  renderSettings: RenderSettings | undefined,
  outputSize: [number, number] | undefined
): number | undefined => {
  if (!renderSettings) {
    return undefined;
  }

  const isScaleFactorSized = isScaleFactorSizedVideoModel(
    renderSettings?.mago_engine
  );
  const isOutputSizeAvailable =
    Array.isArray(outputSize) && outputSize.length === 2;

  if (isOutputSizeAvailable) {
    const [width, height] = outputSize;
    const biggestSide = Math.max(Number(width), Number(height));
    return biggestSide > 0 ? biggestSide : undefined;
  } else if (isScaleFactorSized && !isOutputSizeAvailable) {
    return undefined;
  }

  return renderSettings.max_size;
};
