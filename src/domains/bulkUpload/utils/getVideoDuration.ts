import { getVideoDuration } from "@app/services/mediaBunny/videoUtils";

const VIDEO_DURATION_LIMIT_SECONDS = 60;
const MIN_VIDEO_DURATION_SECONDS = 1;
const MAX_FILE_SIZE_BYTES = 1_073_741_824;
const SUPPORTED_EXTENSIONS = /\.(mp4|mov)$/i;

const VIDEO_FILE_PATTERN = /\.(mp4|mov|webm|m4v|avi|mkv)$/i;

const isVideoTooLong = (seconds: number): boolean =>
  seconds > VIDEO_DURATION_LIMIT_SECONDS;

const isVideoTooShort = (seconds: number): boolean =>
  seconds < MIN_VIDEO_DURATION_SECONDS;

const isFileTooLarge = (file: File): boolean => file.size > MAX_FILE_SIZE_BYTES;

const isUnsupportedFormat = (file: File): boolean =>
  !SUPPORTED_EXTENSIONS.test(file.name);

export const filterVideoFiles = (files: File[]): File[] =>
  files.filter(
    (file) =>
      file.type.startsWith("video/") || VIDEO_FILE_PATTERN.test(file.name)
  );

export const validateVideoFile = async (file: File): Promise<string | null> => {
  if (isUnsupportedFormat(file)) return "bulk_upload.unsupported_format.label";
  if (isFileTooLarge(file)) return "bulk_upload.file_too_large.label";

  const duration = await getVideoDuration(file);
  if (duration === 0) return "bulk_upload.video_broken.label";

  if (isVideoTooShort(duration)) return "bulk_upload.video_too_short.label";
  if (isVideoTooLong(duration)) return "bulk_upload.video_too_long.label";

  return null;
};
