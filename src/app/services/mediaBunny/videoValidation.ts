import { getMediabunny } from "./lazyLoad";
import { TrimOptions, VideoFormatInfo, VideoValidationInfo } from "./types";
import {
  getVideoDuration,
  getExpectedFormat,
  detectContainerFormat
} from "./videoUtils";

const MAX_OUTPUT_SIZE_BYTES = 1073741824;
const BYTES_IN_KB = 1024;
const BYTES_IN_MB = BYTES_IN_KB * BYTES_IN_KB;
const MIN_VIDEO_DURATION_SECONDS = 1;

export async function validateVideoFormat(
  file: File
): Promise<VideoValidationInfo> {
  try {
    const { Input, BlobSource, ALL_FORMATS } = await getMediabunny();
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS
    });

    let videoTrack;
    try {
      videoTrack = await input.getPrimaryVideoTrack();
    } catch (error) {
      return {
        formatInfo: {
          hasValidDuration: false,
          duration: 0,
          detectedFormat: "unknown",
          hasContainerMismatch: false
        },
        error:
          "Unable to read video file. The file may be corrupted or not a valid video format."
      };
    }

    if (!videoTrack) {
      return {
        formatInfo: {
          hasValidDuration: false,
          duration: 0,
          detectedFormat: "unknown",
          hasContainerMismatch: false
        },
        error: "No video track found in the file."
      };
    }

    let duration = 0;
    let hasValidDuration = false;

    try {
      duration = await input.computeDuration();
      hasValidDuration = !isNaN(duration) && isFinite(duration) && duration > 0;
    } catch (error) {
      console.error("Duration computation failed:", error);
      hasValidDuration = false;
    }

    const expectedFormat = getExpectedFormat(file.name);
    const detectedFormat = await detectContainerFormat(file);

    const hasContainerMismatch =
      expectedFormat !== "unknown" &&
      detectedFormat !== "unknown" &&
      expectedFormat !== detectedFormat &&
      detectedFormat === "webm" &&
      expectedFormat === "mp4";

    const canDecode = await videoTrack.canDecode();

    const isCodecSupported = videoTrack.codec && canDecode;

    const formatInfo: VideoFormatInfo = {
      hasValidDuration,
      duration,
      detectedFormat,
      expectedFormat,
      hasContainerMismatch
    };

    let error: string | undefined;

    if (!hasValidDuration) {
      error =
        "Video duration is undefined or invalid. This may indicate a corrupted file or missing metadata.";
    } else if (hasContainerMismatch) {
      error = `Container format mismatch detected. File appears to be ${detectedFormat} format but has ${expectedFormat} extension.`;
    }

    if (!isCodecSupported) {
      error =
        "Video codec is not supported, please use a supported codec (avc, hevc, vp9, av1, vp8)";
    }

    return {
      formatInfo,
      error
    };
  } catch (error) {
    console.error("Video format validation error:", error);
    return {
      formatInfo: {
        hasValidDuration: false,
        duration: 0,
        detectedFormat: "unknown",
        hasContainerMismatch: false
      },
      error:
        error instanceof Error
          ? error.message
          : "Failed to validate video format"
    };
  }
}

export async function validateTrimOptions(
  file: File,
  trimOptions: TrimOptions
): Promise<{ valid: boolean; error?: string }> {
  try {
    const duration = await getVideoDuration(file);

    if (!duration || duration < MIN_VIDEO_DURATION_SECONDS) {
      return {
        valid: false,
        error: "Video duration is too short"
      };
    }

    if (trimOptions.startTime < 0) {
      return {
        valid: false,
        error: "Start time cannot be negative"
      };
    }

    if (trimOptions.endTime > duration) {
      return {
        valid: false,
        error: "End time exceeds video duration"
      };
    }

    if (trimOptions.startTime >= trimOptions.endTime) {
      return {
        valid: false,
        error: "Start time must be before end time"
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("Validation error:", error);
    const errorMessage =
      error instanceof Error
        ? `Validation failed: ${error.message}`
        : "Failed to validate trim options";

    return {
      valid: false,
      error: errorMessage
    };
  }
}

export async function estimateOutputSize(
  file: File,
  trimOptions: TrimOptions
): Promise<{
  estimatedSizeBytes: number;
  exceedsLimit: boolean;
  estimatedSizeMB: number;
}> {
  try {
    const trimDuration = trimOptions.endTime - trimOptions.startTime;
    const totalDuration = await getVideoDuration(file);

    if (totalDuration === 0) {
      throw new Error("Could not determine video duration");
    }

    const inputSizeBytes = file.size;
    const estimatedSizeBytes = (inputSizeBytes * trimDuration) / totalDuration;
    const estimatedSizeMB = estimatedSizeBytes / BYTES_IN_MB;

    return {
      estimatedSizeBytes,
      exceedsLimit: estimatedSizeBytes > MAX_OUTPUT_SIZE_BYTES,
      estimatedSizeMB: Math.round(estimatedSizeMB)
    };
  } catch (error) {
    console.error("Error estimating output size:", error);
    return {
      estimatedSizeBytes: 0,
      exceedsLimit: false,
      estimatedSizeMB: 0
    };
  }
}
