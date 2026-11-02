export type { EncodingProgress } from "./types";

export { trimAndEncodeVideo } from "./videoTrimming";
export { padVideoToMinDuration } from "./padVideoToMinDuration";
export {
  validateVideoFormat,
  validateTrimOptions,
  estimateOutputSize
} from "./videoValidation";
export { extractFrameFromVideo, generateFilmstrip } from "./frameExtraction";
export { composeSbsVideo } from "./composeSbsVideo";
export { composeInfoRichVideo } from "./composeInfoRichVideo";
export { getFps } from "./videoUtils";
export { joinVideosIntoOne, NotJoinableVideosError } from "./joinVideosIntoOne";
