const IMAGE_SOURCE_PREVIEW_LENGTH = 64;

export const loadImageElement = (
  imageSource: string
): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const imageElement = new Image();
    imageElement.crossOrigin = "anonymous";
    imageElement.onload = () => resolve(imageElement);
    imageElement.onerror = () =>
      reject(
        new Error(
          `Could not load image ${imageSource.slice(0, IMAGE_SOURCE_PREVIEW_LENGTH)}`
        )
      );
    imageElement.src = imageSource;
  });
