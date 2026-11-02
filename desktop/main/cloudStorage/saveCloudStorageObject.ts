import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { pipeline } from "node:stream/promises";

import { publishFile } from "../storage/atomicFile";

import type { FetchCloudStorage } from "./fetchCloudStorageObject";
import { openCloudStorageDownload } from "./openCloudStorageDownload";

export const saveCloudStorageObject = async ({
  url,
  allowedHosts,
  destinationPath,
  fetchFromCloudStorage
}: {
  url: unknown;
  allowedHosts: readonly string[];
  destinationPath: string;
  fetchFromCloudStorage?: FetchCloudStorage;
}): Promise<void> => {
  const download = await openCloudStorageDownload({
    url,
    allowedHosts,
    fetchFromCloudStorage
  });

  const partialPath = `${destinationPath}.partial`;
  try {
    await pipeline(download.body, createWriteStream(partialPath));
    await publishFile(partialPath, destinationPath);
  } catch (error) {
    await unlink(partialPath).catch(() => undefined);
    throw error;
  }
};
