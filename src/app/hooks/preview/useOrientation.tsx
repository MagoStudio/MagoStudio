type AspectRatio = [number, number];

type ImageOrientation = "square" | "landscape" | "portrait" | "";

export const useOrientation = (aspectRatio?: AspectRatio): ImageOrientation => {
  return (() => {
    if (!aspectRatio) return "landscape";
    const [width, height] = aspectRatio;
    if (height > width) return "portrait";
    if (width > height) return "landscape";
    return "square";
  })();
};
