const DEFAULT_IMAGE_QUALITY = 0.8;

export interface ResizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  imageQuality?: number;
  imageFormat?: "image/jpeg" | "image/png" | "image/webp";
}

const resizeImageOnCanvas = (
  img: HTMLImageElement,
  options: ResizeImageOptions = {}
): HTMLCanvasElement => {
  const { maxWidth = Infinity, maxHeight = Infinity } = options;

  let width = img.width;
  let height = img.height;

  const aspectRatio = width / height;

  if (maxWidth !== Infinity && maxHeight !== Infinity) {
    if (width > maxWidth || height > maxHeight) {
      if (width / maxWidth > height / maxHeight) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
      } else {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
      }
    }
  } else if (maxWidth !== Infinity) {
    if (width > maxWidth) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);
    }
  } else if (maxHeight !== Infinity) {
    if (height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
};

export const resizeImageFromUrl = async (
  imageUrl: string,
  options: ResizeImageOptions = {}
): Promise<string> => {
  const { imageFormat = "image/jpeg", imageQuality = DEFAULT_IMAGE_QUALITY } =
    options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = resizeImageOnCanvas(img, options);
        const dataUrl = canvas.toDataURL(imageFormat, imageQuality);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
};

export const resizeImageFromFile = async (
  file: File,
  options: ResizeImageOptions = {}
): Promise<File> => {
  const { imageFormat = "image/jpeg", imageQuality = DEFAULT_IMAGE_QUALITY } =
    options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = resizeImageOnCanvas(img, options);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob from canvas"));
              return;
            }

            const extension = imageFormat.split("/")[1];
            const newFile = new File([blob], file.name, {
              type: imageFormat
            });

            resolve(newFile);
          },
          imageFormat,
          imageQuality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const getImageDimensions = async (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};
