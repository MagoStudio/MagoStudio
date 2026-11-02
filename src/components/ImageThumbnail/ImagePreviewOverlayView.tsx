import { SbsTool } from "@home/components/RenderPreview/SbsComparison/SbsTool";
import { useSliderPosition } from "@hooks/useSliderPosition";
import React, { useRef } from "react";

const MAX_POSITION = 100;

type Props = {
  imgSrc: string;
  sourceImageSrc: string;
  maskOverlaySrc?: string;
  name?: string;
};

export const ImagePreviewOverlayView: React.FC<Props> = ({
  imgSrc,
  sourceImageSrc,
  maskOverlaySrc,
  name
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { sliderPosition, handleSliderMouseDown } = useSliderPosition({
    containerRef
  });

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center max-h-full max-w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative">
        <img
          src={sourceImageSrc}
          alt="Source"
          className="max-h-[calc(100vh-8rem)] max-w-full object-contain"
          style={{
            clipPath: `inset(0 ${MAX_POSITION - sliderPosition}% 0 0)`
          }}
        />
        {maskOverlaySrc && (
          <img
            src={maskOverlaySrc}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-90"
            style={{
              clipPath: `inset(0 ${MAX_POSITION - sliderPosition}% 0 0)`
            }}
          />
        )}
        <img
          src={imgSrc}
          alt={name}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        />
        <div
          className="absolute top-0 bottom-0 z-10 -translate-x-1/2 cursor-ew-resize select-none"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleSliderMouseDown}
        >
          <SbsTool />
        </div>
      </div>
    </div>
  );
};
