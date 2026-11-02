import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

import {
  fetchCloudStorageObject,
  type FetchCloudStorage
} from "./fetchCloudStorageObject";

export type CloudStorageAccess = {
  allowedHosts: readonly string[];
  fetchFromCloudStorage?: FetchCloudStorage;
};

export type CloudStorageDownload = {
  body: Readable;
  headers: Headers;
};

export const openCloudStorageDownload = async ({
  url,
  allowedHosts,
  fetchFromCloudStorage,
  signal
}: CloudStorageAccess & {
  url: unknown;
  signal?: AbortSignal;
}): Promise<CloudStorageDownload> => {
  const response = await fetchCloudStorageObject({
    url,
    allowedHosts,
    signal,
    fetchFromCloudStorage
  });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error(
      `Mago cloud storage could not deliver the file (${response.status})`
    );
  }
  return {
    body: Readable.fromWeb(response.body as NodeReadableStream<Uint8Array>),
    headers: response.headers
  };
};
