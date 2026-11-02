import { useRef, useState } from "react";
import { useResizeObserver } from "usehooks-ts";

import { computeContainFit } from "./utils/computeContainFit";

interface ContainFitDimensions {
  width: number;
  height: number;
}

interface UseContainFitDimensionsResult {
  containerRef: React.RefObject<HTMLDivElement>;
  fitDimensions: ContainFitDimensions | null;
  handleImgLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const useContainFitDimensions = (): UseContainFitDimensionsResult => {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [aspect, setAspect] = useState<number | null>(null);
  const { width: containerWidth, height: containerHeight } = useResizeObserver({
    ref: containerRef,
    box: "content-box"
  });

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      setAspect(naturalWidth / naturalHeight);
    }
  };

  const fitDimensions =
    aspect && containerWidth && containerHeight
      ? computeContainFit(containerWidth, containerHeight, aspect)
      : null;

  return { containerRef, fitDimensions, handleImgLoad };
};
