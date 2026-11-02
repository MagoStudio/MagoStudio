const METADATA_TIMEOUT_MS = 10_000;

export const readVideoDurationSeconds = async (
  videoUrl: string
): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    let timeoutId: ReturnType<typeof setTimeout>;

    const detach = () => {
      clearTimeout(timeoutId);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleError);
      video.src = "";
      video.load();
    };

    const handleLoadedMetadata = () => {
      const { duration } = video;
      detach();

      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error(`Video reported an unusable duration: ${duration}`));
        return;
      }

      resolve(duration);
    };

    const handleError = () => {
      detach();
      reject(new Error(`Could not read the duration of ${videoUrl}`));
    };

    timeoutId = setTimeout(() => {
      detach();
      reject(new Error(`Timed out reading the duration of ${videoUrl}`));
    }, METADATA_TIMEOUT_MS);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("error", handleError);
    video.preload = "metadata";
    video.src = videoUrl;
    video.load();
  });
};
