import { spawn } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

import { ProjectRepository } from "../database/projectRepository";

const MAX_FFMPEG_ERROR_LENGTH = 4000;
const MAX_JPEG_BYTES = 67_108_864;
const MAX_FILMSTRIP_FRAMES = 48;
const FFMPEG_TIMEOUT_MS = 60_000;
// eslint-disable-next-line no-magic-numbers -- conventional fallback when legacy cloud metadata has no dimensions
const DEFAULT_PREVIEW_ASPECT_RATIO = 16 / 9;

const executablePath = (): string => {
  if (!ffmpegPath) throw new Error("The bundled video encoder is unavailable");
  return ffmpegPath.replace("app.asar", "app.asar.unpacked");
};

export const filmstripFrameIndices = (
  totalFrames: number,
  requestedFrames: number
): number[] => {
  const available = Math.max(1, Math.floor(totalFrames));
  const count = Math.max(
    1,
    Math.min(MAX_FILMSTRIP_FRAMES, available, Math.floor(requestedFrames))
  );
  if (count === 1) return [0];
  return Array.from({ length: count }, (_, index) =>
    Math.round((index / (count - 1)) * (available - 1))
  );
};

export const buildVideoFrameArgs = (
  inputPath: string,
  frameNumber: number,
  fps: number
): string[] => [
  "-hide_banner",
  "-loglevel",
  "error",
  "-ss",
  String(frameNumber / fps),
  "-i",
  inputPath,
  "-map",
  "0:v:0",
  "-frames:v",
  "1",
  "-c:v",
  "mjpeg",
  "-q:v",
  "2",
  "-f",
  "image2pipe",
  "pipe:1"
];

export const buildVideoFilmstripArgs = (input: {
  inputPath: string;
  width: number;
  frameHeight: number;
  sourceWidth: number;
  sourceHeight: number;
  totalFrames: number;
}): string[] => {
  // Older cloud jobs can lack dimensions even though their downloaded MP4 is
  // perfectly valid. Dimensions only decide how many thumbnails fill the
  // requested width; ffmpeg derives the actual aspect ratio while scaling.
  const aspectRatio =
    input.sourceWidth > 0 && input.sourceHeight > 0
      ? input.sourceWidth / input.sourceHeight
      : DEFAULT_PREVIEW_ASPECT_RATIO;
  const frameWidth = Math.max(1, Math.floor(input.frameHeight * aspectRatio));
  const requestedFrames = Math.max(1, Math.floor(input.width / frameWidth));
  const indices = filmstripFrameIndices(input.totalFrames, requestedFrames);
  const select = indices.map((frame) => `eq(n\\,${frame})`).join("+");
  const filter = [
    `select=${select}`,
    `scale=-2:${input.frameHeight}:force_original_aspect_ratio=decrease`,
    `tile=${indices.length}x1:nb_frames=${indices.length}:padding=0:margin=0`
  ].join(",");

  return [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    input.inputPath,
    "-map",
    "0:v:0",
    "-vf",
    filter,
    "-frames:v",
    "1",
    "-c:v",
    "mjpeg",
    "-q:v",
    "3",
    "-f",
    "image2pipe",
    "pipe:1"
  ];
};

const runJpeg = async (args: string[]): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(executablePath(), args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const chunks: Buffer[] = [];
    let byteLength = 0;
    let errorOutput = "";
    let settled = false;
    const timer = setTimeout(() => {
      child.kill();
      if (!settled) {
        settled = true;
        reject(new Error("ffmpeg timed out extracting the video preview"));
      }
    }, FFMPEG_TIMEOUT_MS);
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    };

    child.stdout.on("data", (chunk: Buffer) => {
      byteLength += chunk.length;
      if (byteLength > MAX_JPEG_BYTES) {
        child.kill();
        fail(new Error("The extracted video preview is too large"));
        return;
      }
      chunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      errorOutput = `${errorOutput}${chunk.toString()}`.slice(
        -MAX_FFMPEG_ERROR_LENGTH
      );
    });
    child.once("error", fail);
    child.once("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0 || byteLength === 0) {
        reject(
          new Error(
            `Unable to extract video preview${
              errorOutput.trim() ? `: ${errorOutput.trim()}` : ""
            }`
          )
        );
        return;
      }
      resolve(
        `data:image/jpeg;base64,${Buffer.concat(chunks).toString("base64")}`
      );
    });
  });

export class VideoFrameService {
  constructor(private readonly repository: ProjectRepository) {}

  async extractFrame(input: {
    assetId: string;
    frameNumber: number;
    fps: number;
  }): Promise<string> {
    const inputPath = await this.repository.resolveMediaPath(
      "asset",
      input.assetId
    );
    if (!inputPath) throw new Error("The local video asset could not be found");
    return runJpeg(
      buildVideoFrameArgs(inputPath, input.frameNumber, input.fps)
    );
  }

  async generateFilmstrip(input: {
    assetId: string;
    width: number;
    frameHeight: number;
  }): Promise<string> {
    const [inputPath, asset] = await Promise.all([
      this.repository.resolveMediaPath("asset", input.assetId),
      this.repository.getAsset(input.assetId)
    ]);
    if (!inputPath || !asset) {
      throw new Error("The local video asset could not be found");
    }
    const size = asset.data.size;
    const sourceWidth = Array.isArray(size) ? Number(size[0]) : 0;
    const sourceHeight = Array.isArray(size) ? Number(size[1]) : 0;
    const totalFrames = Number(asset.data.total_frames);
    if (!Number.isFinite(totalFrames) || totalFrames <= 0) {
      throw new Error("The local video metadata is incomplete");
    }
    return runJpeg(
      buildVideoFilmstripArgs({
        inputPath,
        width: input.width,
        frameHeight: input.frameHeight,
        sourceWidth,
        sourceHeight,
        totalFrames
      })
    );
  }
}
