import { spawn } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

const FFMPEG_PROBE_TIMEOUT_MS = 15_000;
const MAX_PROBE_OUTPUT_LENGTH = 20_000;
const VIDEO_STREAM_LINE = /Stream #\d+:\d+.*?: Video: (.*)$/m;
const STREAM_DIMENSIONS = /(?:^|[\s,])(\d+)x(\d+)(?=[\s,[]|$)/;

export interface ImageDimensions {
  width: number;
  height: number;
}

export const parseFfmpegVideoStreamDimensions = (
  ffmpegOutput: string
): ImageDimensions | null => {
  const videoStreamDescription = VIDEO_STREAM_LINE.exec(ffmpegOutput)?.[1];
  if (!videoStreamDescription) return null;
  const dimensionsMatch = STREAM_DIMENSIONS.exec(videoStreamDescription);
  if (!dimensionsMatch) return null;
  const width = Number(dimensionsMatch[1]);
  const height = Number(dimensionsMatch[2]);
  return width > 0 && height > 0 ? { width, height } : null;
};

const ffmpegExecutablePath = (): string | null =>
  ffmpegPath ? ffmpegPath.replace("app.asar", "app.asar.unpacked") : null;

export const probeImageDimensions = (
  filePath: string
): Promise<ImageDimensions | null> => {
  const executablePath = ffmpegExecutablePath();
  if (!executablePath) return Promise.resolve(null);
  return new Promise((resolve) => {
    const child = spawn(executablePath, ["-hide_banner", "-i", filePath], {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"]
    });
    let probeOutput = "";
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(parseFfmpegVideoStreamDimensions(probeOutput));
    };
    const timer = setTimeout(() => {
      child.kill();
      finish();
    }, FFMPEG_PROBE_TIMEOUT_MS);
    child.stderr.on("data", (chunk: Buffer) => {
      probeOutput = `${probeOutput}${chunk.toString()}`.slice(
        0,
        MAX_PROBE_OUTPUT_LENGTH
      );
    });
    child.once("error", finish);
    child.once("close", finish);
  });
};
