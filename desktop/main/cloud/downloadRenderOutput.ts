import { createWriteStream } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import { resolveCloudConfig } from "../../shared/cloudConfig";
import {
  openCloudStorageDownload,
  type CloudStorageAccess
} from "../cloudStorage/openCloudStorageDownload";
import { publishFile } from "../storage/atomicFile";

/**
 * Downloads a finished cloud render into the library.
 *
 * Once this completes the output is an ordinary local file, so playback works
 * offline and the cloud is never a read path. Written to a temporary name and
 * renamed on success, so an interrupted download cannot leave a truncated file
 * that later looks complete.
 */

type DownloadResult = { relativePath: string; sizeBytes: number };

type DownloadRenderOutputInput = {
  url: string;
  libraryRoot: string;
  jobId: string;
  extension?: string;
  onProgress?: (fraction: number) => void;
  cloudStorage?: CloudStorageAccess;
};

// Development remounts and multiple renderer windows can observe the same
// finished cloud job at once. They must share one download: two writers using
// the same `.partial` path race when the first one renames it into place.
const downloadsInFlight = new Map<string, Promise<DownloadResult>>();

/**
 * A cloud render's output file. The extension matters: an img2img render comes
 * back as a still, and a `.mp4` named PNG confuses both the player and the
 * thumbnailer.
 */
export const renderOutputPath = (
  jobId: string,
  extension: string = "mp4"
): string => `renders/cloud/${jobId}/output.${extension}`;

const performDownload = async (
  input: DownloadRenderOutputInput,
  relativePath: string,
  destination: string
): Promise<DownloadResult> => {
  const cloudStorage = input.cloudStorage ?? {
    allowedHosts: resolveCloudConfig().cloudStorageHosts
  };
  const temporary = `${destination}.partial`;

  const download = await openCloudStorageDownload({
    ...cloudStorage,
    url: input.url
  });
  await mkdir(path.dirname(destination), { recursive: true });
  await unlink(temporary).catch(() => {});

  const expected = Number(download.headers.get("content-length") ?? 0);
  let received = 0;
  download.body.on("data", (chunk: Buffer) => {
    received += chunk.length;
    if (expected > 0) input.onProgress?.(received / expected);
  });

  try {
    await pipeline(download.body, createWriteStream(temporary));
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }

  const { size } = await stat(temporary);
  if (size === 0) {
    await unlink(temporary).catch(() => {});
    throw new Error("The downloaded render output was empty");
  }
  if (expected > 0 && size !== expected) {
    await unlink(temporary).catch(() => {});
    throw new Error(
      `The render output download was incomplete (${size} of ${expected} bytes)`
    );
  }

  await publishFile(temporary, destination);
  return { relativePath, sizeBytes: size };
};

export const downloadRenderOutput = async (
  input: DownloadRenderOutputInput
): Promise<DownloadResult> => {
  const relativePath = renderOutputPath(input.jobId, input.extension);
  const destination = path.join(input.libraryRoot, relativePath);
  const existing = downloadsInFlight.get(destination);
  if (existing) return existing;

  const operation = performDownload(input, relativePath, destination);
  downloadsInFlight.set(destination, operation);
  try {
    return await operation;
  } finally {
    if (downloadsInFlight.get(destination) === operation) {
      downloadsInFlight.delete(destination);
    }
  }
};
