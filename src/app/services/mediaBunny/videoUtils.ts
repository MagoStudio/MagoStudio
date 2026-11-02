import { getMediabunny } from "./lazyLoad";

const PACKET_STATS_SAMPLE_COUNT = 100;

const isUnsupportedFormatError = (error: unknown): boolean =>
  error instanceof Error && error.name === "UnsupportedInputFormatError";

export async function getVideoDuration(file: File): Promise<number> {
  try {
    const { Input, BlobSource, ALL_FORMATS } = await getMediabunny();
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS
    });

    const duration = await input.computeDuration();
    return duration;
  } catch (error) {
    if (!isUnsupportedFormatError(error)) {
      console.error("Error getting video duration:", error);
    }
    return 0;
  }
}

export function getExpectedFormat(filename: string): string {
  const extension = filename.toLowerCase().split(".").pop();
  switch (extension) {
    case "mp4":
    case "m4v":
      return "mp4";
    case "mov":
      return "quicktime";
    case "webm":
      return "webm";
    case "mkv":
      return "matroska";
    default:
      return "unknown";
  }
}

export async function detectContainerFormat(file: File): Promise<string> {
  try {
    const { Input, BlobSource, ALL_FORMATS } = await getMediabunny();
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS
    });

    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      return "unknown";
    }

    const codec = videoTrack.codec?.toLowerCase() || "";

    if (codec.includes("vp9") || codec.includes("vp8")) {
      return "webm";
    } else if (
      codec.includes("avc") ||
      codec.includes("h264") ||
      codec.includes("hevc") ||
      codec.includes("h265")
    ) {
      return "mp4";
    }

    return "unknown";
  } catch (error) {
    if (!isUnsupportedFormatError(error)) {
      console.error("Error detecting container format:", error);
    }
    return "unknown";
  }
}

export async function getFps(file: File): Promise<number> {
  try {
    const { Input, BlobSource, ALL_FORMATS } = await getMediabunny();
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS
    });

    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      throw new Error("No video track found in the input file");
    }

    videoTrack.displayWidth;
    videoTrack.displayHeight;
    videoTrack.rotation;

    const packetStats = await videoTrack.computePacketStats(
      PACKET_STATS_SAMPLE_COUNT
    );
    const averageFrameRate = packetStats.averagePacketRate;
    return averageFrameRate;
  } catch (error) {
    if (!isUnsupportedFormatError(error)) {
      console.error("Error getting fps:", error);
    }
    return 0;
  }
}
