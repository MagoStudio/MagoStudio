import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import https, { Agent } from "node:https";
import { Readable, Transform } from "node:stream";

/**
 * Streams a prepared file to a presigned S3 URL.
 *
 * The upload runs in the main process because that is where the file is: the
 * renderer never sees a native path, and streaming avoids holding a multi-
 * hundred-megabyte video in memory. S3 credentials are never involved — the
 * presigned URL arrives from the backend over the authenticated API.
 */

const HTTP_OK_MIN = 200;
const HTTP_OK_MAX = 300;
const ERROR_BODY_LIMIT = 500;

export interface PresignedUploadRequest {
  filePath: string;
  presignedUrl: string;
  contentType: string;
  onProgress?: (fraction: number) => void;
  /** Test seam: lets an integration test trust a local self-signed listener. */
  agent?: Agent;
}

/**
 * Rejects anything that is not a plain https URL. A presigned URL always is,
 * and this keeps a malformed or hostile value from turning into a request to
 * somewhere unintended.
 */
export const assertUploadUrl = (value: string): URL => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("The upload URL is not a valid URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("Refusing to upload over anything but https");
  }
  return url;
};

export const uploadHeaders = (
  contentType: string,
  sizeBytes: number
): Record<string, string | number> => ({
  // Both are part of what S3 expects for a presigned PUT; omitting the length
  // makes undici fall back to chunked encoding, which S3 rejects.
  "content-type": contentType,
  "content-length": sizeBytes
});

export const uploadFileToPresignedUrl = async (
  request: PresignedUploadRequest
): Promise<void> => {
  const url = assertUploadUrl(request.presignedUrl);
  const { size } = await stat(request.filePath);
  if (size === 0) throw new Error("Refusing to upload an empty file");
  await putToPresignedUrl({
    url,
    size,
    source: createReadStream(request.filePath),
    contentType: request.contentType,
    onProgress: request.onProgress,
    agent: request.agent
  });
};

/**
 * PUTs bytes the renderer already holds, e.g. a video the user just trimmed.
 * The renderer cannot PUT to S3 itself: its origin is not in the bucket's CORS
 * policy, and a main-process request is not subject to CORS at all.
 */
export const uploadBytesToPresignedUrl = async (request: {
  bytes: Buffer;
  presignedUrl: string;
  contentType: string;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
  agent?: Agent;
}): Promise<void> => {
  const url = assertUploadUrl(request.presignedUrl);
  if (request.bytes.length === 0) {
    throw new Error("Refusing to upload an empty file");
  }
  await putToPresignedUrl({
    url,
    size: request.bytes.length,
    source: Readable.from([request.bytes]),
    contentType: request.contentType,
    onProgress: request.onProgress,
    signal: request.signal,
    agent: request.agent
  });
};

const putToPresignedUrl = ({
  url,
  size,
  source,
  contentType,
  onProgress,
  signal,
  agent
}: {
  url: URL;
  size: number;
  source: Readable;
  contentType: string;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
  agent?: Agent;
}): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      source.destroy();
      reject(new Error("The upload was cancelled"));
      return;
    }
    const outbound = https.request(
      url,
      {
        method: "PUT",
        headers: uploadHeaders(contentType, size),
        agent
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status >= HTTP_OK_MIN && status < HTTP_OK_MAX) {
          response.resume();
          resolve();
          return;
        }
        let body = "";
        response.on("data", (chunk: Buffer) => {
          body = `${body}${chunk.toString()}`.slice(0, ERROR_BODY_LIMIT);
        });
        response.once("end", () =>
          reject(
            new Error(
              `The upload was rejected with status ${status}${
                body.trim() ? `: ${body.trim()}` : ""
              }`
            )
          )
        );
      }
    );

    outbound.once("error", reject);

    // Progress is counted in a pass-through rather than a "data" listener:
    // attaching one alongside pipe() puts the stream into flowing mode twice
    // and the read fails.
    let uploaded = 0;
    const counter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        uploaded += chunk.length;
        onProgress?.(uploaded / size);
        callback(null, chunk);
      }
    });

    const fail = (error: Error) => {
      source.destroy();
      outbound.destroy();
      reject(error);
    };
    signal?.addEventListener(
      "abort",
      () => fail(new Error("The upload was cancelled")),
      { once: true }
    );
    source.once("error", fail);
    counter.once("error", fail);
    source.pipe(counter).pipe(outbound);
  });
