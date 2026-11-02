type HasImg2ImgInputImageParams = {
  frameType: "video" | "upload";
  maskLayerDataUrl: string | undefined;
  maskedFrameSrc: string | undefined;
  inputTrackFrameSrc: string | undefined;
};

export const hasImg2ImgInputImage = ({
  frameType,
  maskLayerDataUrl,
  maskedFrameSrc,
  inputTrackFrameSrc
}: HasImg2ImgInputImageParams): boolean => {
  if (frameType === "upload") return true;

  const hasSavedDrawnMask =
    Boolean(maskLayerDataUrl) && Boolean(maskedFrameSrc);

  return hasSavedDrawnMask || Boolean(inputTrackFrameSrc);
};
