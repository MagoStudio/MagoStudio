import sampleVideoUrl from "../../../tests/fixtures/videoFiles/sample-video.mp4?url";

export const useVideoAsset = () => ({
  data: { urlToUse: sampleVideoUrl },
  isLoading: false
});
