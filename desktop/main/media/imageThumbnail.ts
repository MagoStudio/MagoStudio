import { spawn } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

import { atomicProduceFile } from "../storage/atomicFile";

const THUMBNAIL_EDGE_PX = 480;
const FFMPEG_TIMEOUT_MS = 30_000;
const MAX_ERROR_LENGTH = 2000;

const executablePath = (): string => {
  if (!ffmpegPath) throw new Error("The bundled image encoder is unavailable");
  return ffmpegPath.replace("app.asar", "app.asar.unpacked");
};

/** Builds a bounded JPEG in a child process so decoding a large reference
 * image never stalls Electron's main thread or project navigation. */
const createThumbnailFile = (
  sourcePath: string,
  outputPath: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(
      executablePath(),
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        sourcePath,
        "-frames:v",
        "1",
        "-vf",
        `scale=${THUMBNAIL_EDGE_PX}:${THUMBNAIL_EDGE_PX}:force_original_aspect_ratio=decrease`,
        "-q:v",
        "4",
        "-c:v",
        "mjpeg",
        "-f",
        "image2",
        "-y",
        outputPath
      ],
      { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] }
    );
    let errorOutput = "";
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(new Error("Timed out creating the image preview"));
    }, FFMPEG_TIMEOUT_MS);
    child.stderr.on("data", (chunk: Buffer) => {
      errorOutput = `${errorOutput}${chunk.toString()}`.slice(
        -MAX_ERROR_LENGTH
      );
    });
    child.once("error", finish);
    child.once("close", (code) => {
      if (code === 0) finish();
      else {
        finish(
          new Error(
            `Unable to create the image preview${errorOutput.trim() ? `: ${errorOutput.trim()}` : ""}`
          )
        );
      }
    });
  });

export const createImageThumbnail = (
  sourcePath: string,
  outputPath: string
): Promise<void> =>
  atomicProduceFile(outputPath, (temporary) =>
    createThumbnailFile(sourcePath, temporary)
  );
