import { SourceVideoTrim } from "../../shared/normalizeSourceVideoTrim";
import { toSourceVideoTrimKey } from "../../shared/toSourceVideoTrimKey";

/**
 * Builds the ffmpeg invocation that prepares a local video for cloud upload.
 *
 * Cloud ingestion re-encodes only when the input is not h264, or its audio is not
 * aac, or its colour space is not bt709, or a resolution/fps change was asked
 * for. Producing exactly that shape
 * here means the cloud side takes its `-c copy` branch: a stream copy plus a
 * thumbnail pass, seconds rather than minutes, with no change needed on the
 * ingestion service.
 *
 * Trimming happens here too, so the uploaded file is the clip the user actually
 * chose rather than the whole source with offsets attached.
 */

export interface UploadEncodeOptions {
  sourcePath: string;
  outputPath: string;
  /** Seconds from the start of the source; omitted means from the beginning. */
  trimStartSeconds?: number;
  /** Seconds from the start of the source; omitted means to the end. */
  trimEndSeconds?: number;
}

/** Matches cloud ingestion's expectations, so its re-encode test comes out false. */
const H264_PRESET = "medium";
const H264_CRF = "15";
const AUDIO_CODEC = "aac";
const MIN_TRIM_DURATION_SECONDS = 0.01;

export const buildUploadEncodeArgs = (
  options: UploadEncodeOptions
): string[] => {
  const { sourcePath, outputPath, trimStartSeconds, trimEndSeconds } = options;

  if (trimStartSeconds !== undefined && trimStartSeconds < 0) {
    throw new Error("Trim start cannot be negative");
  }
  if (
    trimStartSeconds !== undefined &&
    trimEndSeconds !== undefined &&
    trimEndSeconds - trimStartSeconds < MIN_TRIM_DURATION_SECONDS
  ) {
    throw new Error("Trim range is too short to encode");
  }

  const args = ["-y", "-nostdin"];

  // Seeking before -i is the fast path; ffmpeg still lands on an exact frame
  // because the output is re-encoded rather than copied.
  if (trimStartSeconds !== undefined && trimStartSeconds > 0) {
    args.push("-ss", String(trimStartSeconds));
  }
  args.push("-i", sourcePath);
  if (trimEndSeconds !== undefined) {
    const duration = trimEndSeconds - (trimStartSeconds ?? 0);
    args.push("-t", String(duration));
  }

  args.push(
    "-map",
    "0:v:0",
    // Audio is optional: `?` keeps the mapping from failing on a silent video.
    "-map",
    "0:a:0?",
    "-c:v",
    "libx264",
    "-preset",
    H264_PRESET,
    "-crf",
    H264_CRF,
    // bt709 on all three, or ingestion re-encodes purely to normalise colour.
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    // yuv420p is what h264 baseline consumers expect; 10-bit or 4:2:2 sources
    // would otherwise produce a file the cloud pipeline has to touch again.
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    AUDIO_CODEC,
    // Strip rotation metadata: ingestion applies rotation itself, and a rotated
    // stream plus a rotation tag double-applies it.
    "-metadata:s:v:0",
    "rotate=0",
    // faststart so the cloud can read the moov atom without the whole file.
    "-movflags",
    "+faststart",
    "-f",
    "mp4",
    outputPath
  );

  return args;
};

const UPLOAD_ENCODE_ARGS_VERSION = 1;

export const uploadCachePath = (
  input: { assetId: string } & SourceVideoTrim
): string =>
  `cloud/uploads/${input.assetId}.encode-v${UPLOAD_ENCODE_ARGS_VERSION}.trim-${toSourceVideoTrimKey(input)}.mp4`;

export const uploadCachePathBeforeTrimWasKeyed = (assetId: string): string =>
  `cloud/uploads/${assetId}.mp4`;
