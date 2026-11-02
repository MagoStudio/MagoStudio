const DEFAULT_VIDEO_FPS = 30;
const DEFAULT_IMAGE_QUALITY = 0.95;

export interface CaptureVideoFrameOptions {
  videoUrl: string;
  frame: number;
  fps?: number;
  imageFormat?: "image/jpeg" | "image/png";
  imageQuality?: number;
}

export const captureVideoFrame = async ({
  videoUrl,
  frame,
  fps = DEFAULT_VIDEO_FPS,
  imageFormat = "image/jpeg",
  imageQuality = DEFAULT_IMAGE_QUALITY
}: CaptureVideoFrameOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    video.crossOrigin = "anonymous";

    const handleLoadedMetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const timeInSeconds = frame / fps;
      video.currentTime = timeInSeconds;
    };

    const handleSeeked = () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameDataUrl = canvas.toDataURL(imageFormat, imageQuality);
        resolve(frameDataUrl);
        cleanupEventListeners();
      } catch (error) {
        reject(error);
        cleanupEventListeners();
      }
    };

    const handleError = (error: Event) => {
      reject(new Error("Error loading video: " + error.type));
      cleanupEventListeners();
    };

    const cleanupEventListeners = () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);

    video.src = videoUrl;
    video.load();
  });
};
