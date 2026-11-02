import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { link, readFile, stat, unlink } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import { atomicWriteFile, syncFile } from "../storage/atomicFile";

type Metadata = {
  url: string;
  validator: string | null;
  size: number | null;
  checksum: string | null;
  partialHash: string | null;
};
const PARTIAL_CONTENT = 206;
const RANGE_NOT_SATISFIABLE = 416;
const TIMEOUT_MS = 21_600_000;
const active = new Set<string>();
const digest = async (file: string) => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
};

/** Partials belong to this downloader, and only verified, unchanged partials
 * are appended. If-Range prevents mixing different revisions of a file. */
export const resumableDownload = async (
  url: string,
  destination: string,
  signal?: AbortSignal,
  onProgress?: (bytes: number, total: number | null) => void,
  expectedSha256?: string
): Promise<void> => {
  if (active.has(destination))
    throw new Error("This file is already downloading.");
  active.add(destination);
  const partial = destination + ".mago-part";
  const metadataPath = partial + ".json";
  try {
    if (await stat(destination).catch(() => null))
      throw new Error(
        "The destination file already exists. Choose another folder or remove it before downloading."
      );
    let metadata: Metadata | null = null;
    try {
      metadata = JSON.parse(await readFile(metadataPath, "utf8")) as Metadata;
    } catch {
      /* New download. */
    }
    let offset = (await stat(partial).catch(() => null))?.size ?? 0;
    const canResume =
      metadata?.url === url &&
      metadata.validator &&
      metadata.partialHash &&
      offset > 0 &&
      metadata.partialHash === (await digest(partial));
    if (!canResume) offset = 0;
    const headers: Record<string, string> = { "Accept-Encoding": "identity" };
    if (offset && metadata?.validator) {
      headers.Range = `bytes=${offset}-`;
      headers["If-Range"] = metadata.validator;
    }
    const combinedSignal = signal
      ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)])
      : AbortSignal.timeout(TIMEOUT_MS);
    let response = await fetch(url, { headers, signal: combinedSignal });
    if (response.status === RANGE_NOT_SATISFIABLE && offset) {
      await response.body?.cancel();
      offset = 0;
      response = await fetch(url, {
        headers: { "Accept-Encoding": "identity" },
        signal: combinedSignal
      });
    }
    if (!response.ok || !response.body)
      throw new Error(
        `Download failed (${response.status}). Retry to resume where supported.`
      );
    if (response.headers.get("content-type")?.includes("text/html")) {
      await response.body.cancel();
      throw new Error(
        "The source returned a web page instead of a file. Check the source link."
      );
    }
    const range = response.headers
      .get("content-range")
      ?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
    if (
      response.status === PARTIAL_CONTENT &&
      (!offset ||
        !range ||
        Number(range[1]) !== offset ||
        Number(range[2]) < offset)
    ) {
      await response.body.cancel();
      throw new Error(
        "Invalid resume response. The partial download was retained."
      );
    }
    if (response.status !== PARTIAL_CONTENT) offset = 0; // Server ignored Range or changed revision.
    const etag = response.headers.get("etag");
    const validator =
      etag && !etag.startsWith("W/")
        ? etag
        : response.headers.get("last-modified");
    const checksumHeader =
      response.headers.get("x-checksum-sha256") ??
      response.headers.get("x-linked-etag");
    const checksum = checksumHeader?.replaceAll('"', "");
    const length = response.headers.get("content-length");
    metadata = {
      url,
      validator,
      size:
        range && response.status === PARTIAL_CONTENT
          ? Number(range[3])
          : length !== null
            ? Number(length)
            : null,
      checksum:
        checksum && /^[a-f0-9]{64}$/i.test(checksum)
          ? checksum.toLowerCase()
          : offset
            ? (metadata?.checksum ?? null)
            : null,
      partialHash: null
    };
    if (expectedSha256) metadata.checksum = expectedSha256;
    await atomicWriteFile(metadataPath, JSON.stringify(metadata));
    let received = offset;
    onProgress?.(received, metadata.size);
    const progress = new Transform({
      transform(chunk, _encoding, callback) {
        received += chunk.length;
        onProgress?.(received, metadata?.size ?? null);
        callback(null, chunk);
      }
    });
    try {
      await pipeline(
        Readable.fromWeb(
          response.body as import("node:stream/web").ReadableStream
        ),
        progress,
        createWriteStream(partial, { flags: offset ? "a" : "w" }),
        { signal: combinedSignal }
      );
    } catch (error) {
      metadata.partialHash = await digest(partial).catch(() => null);
      await atomicWriteFile(metadataPath, JSON.stringify(metadata));
      if (signal?.aborted)
        throw new Error(
          "Paused. Click Resume and choose the same folder to continue."
        );
      throw error;
    }
    const size = (await stat(partial)).size;
    if (metadata.size !== null && size !== metadata.size) {
      metadata.partialHash = await digest(partial);
      await atomicWriteFile(metadataPath, JSON.stringify(metadata));
      throw new Error(
        "Incomplete download. Retry and choose the same folder to resume."
      );
    }
    if (metadata.checksum && (await digest(partial)) !== metadata.checksum) {
      await unlink(partial);
      await unlink(metadataPath);
      throw new Error(
        "SHA-256 verification failed. Retry to download a fresh copy."
      );
    }
    // Publish without overwriting an existing file, on the same filesystem.
    await syncFile(partial);
    await link(partial, destination);
    await unlink(partial);
    await unlink(metadataPath);
  } finally {
    active.delete(destination);
  }
};
