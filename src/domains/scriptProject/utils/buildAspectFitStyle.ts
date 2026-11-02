import { ProjectOutputSize } from "./projectOutputSize";

export interface AspectFitStyle {
  aspectRatio: string;
  width: string;
}

export const buildAspectFitStyle = (
  outputSize: ProjectOutputSize,
  availableHeightCss?: string
): AspectFitStyle => {
  const [outputWidthPx, outputHeightPx] = outputSize;

  const isOutputSizeUsable = outputWidthPx > 0 && outputHeightPx > 0;
  if (!isOutputSizeUsable) return { aspectRatio: "1 / 1", width: "100%" };

  const aspectRatio = `${outputWidthPx} / ${outputHeightPx}`;
  if (!availableHeightCss) return { aspectRatio, width: "100%" };

  return {
    aspectRatio,
    width: `min(100%, calc(${availableHeightCss} * ${outputWidthPx} / ${outputHeightPx}))`
  };
};
