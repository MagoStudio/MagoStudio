import { spawn } from "node:child_process";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";

import { contentTypeForExtension } from "./localAssetInfo";

const CLOUD_ACCEPTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);
const CLOUD_CONVERTED_IMAGE_EXTENSION = "png";
const CLOUD_IMAGE_CACHE_DIRECTORY = path.join("cloud", "images");
const FFMPEG_CONVERT_TIMEOUT_MS = 60_000;
const MAX_FFMPEG_ERROR_LENGTH = 2_000;

export interface CloudImageFile {
  filePath: string;
  extension: string;
  contentType: string;
}

export const isCloudAcceptedImageExtension = (extension: string): boolean =>
  CLOUD_ACCEPTED_IMAGE_EXTENSIONS.has(extension.toLowerCase());

export const buildPngConversionArgs = (
  sourcePath: string,
  outputPath: string
): string[] => [
  "-hide_banner",
  "-loglevel",
  "error",
  "-nostdin",
  "-y",
  "-i",
  sourcePath,
  "-frames:v",
  "1",
  "-c:v",
  "png",
  "-f",
  "image2",
  outputPath
];

const isCachedConversionFresh = async (
  outputPath: string,
  sourcePath: string
): Promise<boolean> => {
  try {
    const [output, source] = await Promise.all([
      stat(outputPath),
      stat(sourcePath)
    ]);
    return output.size > 0 && output.mtimeMs >= source.mtimeMs;
  } catch {
    return false;
  }
};

const runFfmpeg = (args: string[]): Promise<void> => {
  if (!ffmpegPath) {
    return Promise.reject(
      new Error("The bundled image encoder is unavailable")
    );
  }
  const executablePath = ffmpegPath.replace("app.asar", "app.asar.unpacked");
  return new Promise((resolve, reject) => {
    const child = spawn(executablePath, args, {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"]
    });
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
      finish(new Error("Timed out converting the image for cloud Mago"));
    }, FFMPEG_CONVERT_TIMEOUT_MS);
    child.stderr.on("data", (chunk: Buffer) => {
      errorOutput = `${errorOutput}${chunk.toString()}`.slice(
        -MAX_FFMPEG_ERROR_LENGTH
      );
    });
    child.once("error", finish);
    child.once("close", (code) => {
      if (code === 0) {
        finish();
        return;
      }
      const ffmpegReason = errorOutput.trim();
      finish(
        new Error(
          `Unable to convert the image for cloud Mago${ffmpegReason ? `: ${ffmpegReason}` : ""}`
        )
      );
    });
  });
};

export const prepareCloudImageFile = async (input: {
  assetId: string;
  sourcePath: string;
  extension: string;
  libraryRoot: string;
}): Promise<CloudImageFile> => {
  const extension = input.extension.toLowerCase();
  if (isCloudAcceptedImageExtension(extension)) {
    return {
      filePath: input.sourcePath,
      extension,
      contentType: contentTypeForExtension(extension)
    };
  }

  const outputPath = path.join(
    input.libraryRoot,
    CLOUD_IMAGE_CACHE_DIRECTORY,
    `${input.assetId}.${CLOUD_CONVERTED_IMAGE_EXTENSION}`
  );
  if (!(await isCachedConversionFresh(outputPath, input.sourcePath))) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await unlink(outputPath).catch(() => {});
    await runFfmpeg(buildPngConversionArgs(input.sourcePath, outputPath));
  }
  return {
    filePath: outputPath,
    extension: CLOUD_CONVERTED_IMAGE_EXTENSION,
    contentType: contentTypeForExtension(CLOUD_CONVERTED_IMAGE_EXTENSION)
  };
};
