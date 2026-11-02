const DEFAULT_IMAGE_QUALITY = 0.95;

export interface CaptureFrameFromVideoElementOptions {
  videoElement: HTMLVideoElement;
  imageFormat?: "image/jpeg" | "image/png";
  imageQuality?: number;
}

export const captureFrameFromVideoElement = async ({
  videoElement,
  imageFormat = "image/jpeg",
  imageQuality = DEFAULT_IMAGE_QUALITY
}: CaptureFrameFromVideoElementOptions): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not get canvas context");
  }

  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to convert canvas to blob"));
          return;
        }
        resolve(blob);
      },
      imageFormat,
      imageQuality
    );
  });
};
