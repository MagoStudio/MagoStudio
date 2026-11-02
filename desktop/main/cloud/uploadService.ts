import { spawn } from "node:child_process";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";

import { normalizeSourceVideoTrim } from "../../shared/normalizeSourceVideoTrim";

import {
  buildUploadEncodeArgs,
  uploadCachePath,
  uploadCachePathBeforeTrimWasKeyed
} from "./uploadEncode";
import { uploadFileToPresignedUrl } from "./uploadFile";

/**
 * Prepares local media for cloud rendering and uploads it.
 *
 * Everything here is deliberately in the main process: the renderer never sees a
 * native path, the encode needs a real ffmpeg, and streaming the upload avoids
 * holding a large video in memory. The renderer supplies the presigned URL it
 * obtained over the authenticated API; no cloud credentials exist here.
 */

const MAX_FFMPEG_ERROR_LENGTH = 2_000;
const UPLOAD_CONTENT_TYPE = "video/mp4";

export interface PreparedUpload {
  /** Absolute path of the encoded file, inside the library. */
  filePath: string;
  /** Path relative to the library root, for storing alongside the link. */
  relativePath: string;
  sizeBytes: number;
  /** False when a cached encode from an earlier attempt was reused. */
  encoded: boolean;
}

export class UploadService {
  constructor(private readonly getLibraryRoot: () => Promise<string | null>) {}

  private async requireLibraryRoot(): Promise<string> {
    const root = await this.getLibraryRoot();
    if (!root) throw new Error("Choose a Mago library folder first");
    return root;
  }

  /**
   * Encodes to the shape that makes cloud ingestion a stream copy, caching the
   * result so a retry or a second render of the same clip does not re-encode.
   */
  async prepare(input: {
    assetId: string;
    sourcePath: string;
    trimStartSeconds?: number;
    trimEndSeconds?: number;
    force?: boolean;
  }): Promise<PreparedUpload> {
    const root = await this.requireLibraryRoot();
    const sourceVideoTrim = normalizeSourceVideoTrim(input);
    const relativePath = uploadCachePath({
      assetId: input.assetId,
      ...sourceVideoTrim
    });
    const outputPath = path.join(root, relativePath);

    if (!input.force) {
      const cached = await this.cachedUpload(outputPath, input.sourcePath);
      if (cached) {
        return {
          filePath: outputPath,
          relativePath,
          sizeBytes: cached,
          encoded: false
        };
      }
    }

    await mkdir(path.dirname(outputPath), { recursive: true });
    // A partial file from an interrupted attempt must not be mistaken for a
    // finished encode, and ffmpeg is asked to overwrite anyway.
    await unlink(outputPath).catch(() => {});

    await this.runFfmpeg(
      buildUploadEncodeArgs({
        sourcePath: input.sourcePath,
        outputPath,
        ...sourceVideoTrim
      })
    );
    await unlink(
      path.join(root, uploadCachePathBeforeTrimWasKeyed(input.assetId))
    ).catch(() => {});

    const { size } = await stat(outputPath);
    if (size === 0) {
      await unlink(outputPath).catch(() => {});
      throw new Error("The prepared upload was empty");
    }
    return {
      filePath: outputPath,
      relativePath,
      sizeBytes: size,
      encoded: true
    };
  }

  /**
   * A cached encode counts only if it is newer than the source, so editing or
   * replacing the source video invalidates it.
   */
  private async cachedUpload(
    outputPath: string,
    sourcePath: string
  ): Promise<number | null> {
    try {
      const [output, source] = await Promise.all([
        stat(outputPath),
        stat(sourcePath)
      ]);
      if (output.size === 0) return null;
      return output.mtimeMs >= source.mtimeMs ? output.size : null;
    } catch {
      return null;
    }
  }

  async upload(input: {
    filePath: string;
    presignedUrl: string;
    onProgress?: (fraction: number) => void;
  }): Promise<void> {
    await uploadFileToPresignedUrl({
      filePath: input.filePath,
      presignedUrl: input.presignedUrl,
      contentType: UPLOAD_CONTENT_TYPE,
      onProgress: input.onProgress
    });
  }

  private async runFfmpeg(args: string[]): Promise<void> {
    if (!ffmpegPath) throw new Error("The bundled ffmpeg is unavailable");
    const executable = ffmpegPath.replace("app.asar", "app.asar.unpacked");

    await new Promise<void>((resolve, reject) => {
      const child = spawn(executable, args, {
        windowsHide: true,
        stdio: ["ignore", "ignore", "pipe"]
      });
      let errorOutput = "";
      child.stderr.on("data", (chunk: Buffer) => {
        errorOutput = `${errorOutput}${chunk.toString()}`.slice(
          -MAX_FFMPEG_ERROR_LENGTH
        );
      });
      child.once("error", reject);
      child.once("exit", (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(
          new Error(
            `Unable to prepare the video for upload${
              errorOutput.trim() ? `: ${errorOutput.trim()}` : ""
            }`
          )
        );
      });
    });
  }
}
