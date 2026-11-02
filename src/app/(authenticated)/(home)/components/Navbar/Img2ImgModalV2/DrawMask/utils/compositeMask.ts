import { MASK_OPACITY } from "../constants";

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

let cache: {
  frameSrc: string;
  maskLayerDataUrl: string;
  result: string;
} | null = null;

export const compositeMask = async (
  frameSrc: string,
  maskLayerDataUrl: string
): Promise<string> => {
  if (
    cache &&
    cache.frameSrc === frameSrc &&
    cache.maskLayerDataUrl === maskLayerDataUrl
  ) {
    return cache.result;
  }

  const [frame, maskLayer] = await Promise.all([
    loadImage(frameSrc),
    loadImage(maskLayerDataUrl)
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = frame.naturalWidth || frame.width;
  canvas.height = frame.naturalHeight || frame.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context for mask compositing");
  }

  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = MASK_OPACITY;
  ctx.drawImage(maskLayer, 0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  const result = canvas.toDataURL("image/jpeg", 0.92);
  cache = { frameSrc, maskLayerDataUrl, result };
  return result;
};

export const __resetCompositeMaskCache = () => {
  cache = null;
};
