type IsDrawnMaskOnFrameParams = {
  maskFrameIdx: number | undefined;
  maskedFrameSrc: string | undefined;
  maskLayerDataUrl: string | undefined;
  currentFrame: number;
};

export const isDrawnMaskOnFrame = ({
  maskFrameIdx,
  maskedFrameSrc,
  maskLayerDataUrl,
  currentFrame
}: IsDrawnMaskOnFrameParams): boolean =>
  maskFrameIdx === currentFrame &&
  Boolean(maskedFrameSrc) &&
  Boolean(maskLayerDataUrl);
