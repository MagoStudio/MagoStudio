import { useContainFitDimensions } from "@domains/sam/useContainFitDimensions";
import React from "react";

type Props = {
  imgSrc: string;
  name?: string;
  overlay?: React.ReactNode;
};

export const ImagePreviewSingleView: React.FC<Props> = ({
  imgSrc,
  name,
  overlay
}) => {
  const { containerRef, fitDimensions, handleImgLoad } =
    useContainFitDimensions();

  if (!overlay) {
    return (
      <img
        src={imgSrc}
        alt={name}
        className="max-h-full max-w-full object-contain"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center"
    >
      <div
        className="relative"
        style={
          fitDimensions
            ? { width: fitDimensions.width, height: fitDimensions.height }
            : undefined
        }
      >
        <img
          src={imgSrc}
          alt={name}
          onLoad={handleImgLoad}
          className="block h-full w-full object-contain"
        />
        {overlay}
      </div>
    </div>
  );
};
