import React from "react";

type Props = {
  imgSrc: string;
  sourceImageSrc: string;
  maskOverlaySrc?: string;
  name?: string;
};

export const ImagePreviewSideBySideView: React.FC<Props> = ({
  imgSrc,
  sourceImageSrc,
  maskOverlaySrc,
  name
}) => (
  <div className="flex h-full w-full gap-2 p-4">
    <div className="relative flex flex-1 items-center justify-center">
      <img
        src={sourceImageSrc}
        alt="Source"
        className="max-h-full max-w-full object-contain"
      />
      {maskOverlaySrc && (
        <img
          src={maskOverlaySrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-90"
        />
      )}
    </div>
    <div className="flex flex-1 items-center justify-center">
      <img
        src={imgSrc}
        alt={name}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  </div>
);
