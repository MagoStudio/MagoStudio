import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { protocol } from "electron";

import { resolveCloudConfig } from "../shared/cloudConfig";

import { cloudStorageProtocolResponse } from "./cloudStorage/cloudStorageProtocolResponse";
import { ProjectRepository } from "./database/projectRepository";
import { ScriptProjectSnapshotRepository } from "./database/scriptProjectSnapshotRepository";
import { clearLibraryIssue, reportLibraryIssue } from "./libraryHealth";

const HTTP_OK = 200;
const HTTP_PARTIAL_CONTENT = 206;
const CLOUD_STORAGE_PROTOCOL_HOST = "cloud-storage";

const mediaContentType = (filePath: string): string => {
  switch (path.extname(filePath).toLowerCase()) {
    case ".mp4":
    case ".m4v":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".webm":
      return "video/webm";
    case ".mkv":
      return "video/x-matroska";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
};

const parseByteRange = (
  value: string | null,
  size: number
): { start: number; end: number } | null => {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return null;
    return { start: Math.max(0, size - suffixLength), end: size - 1 };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(requestedEnd) ||
    start < 0 ||
    start >= size ||
    requestedEnd < start
  ) {
    return null;
  }
  return { start, end: Math.min(requestedEnd, size - 1) };
};

const mediaFileResponse = async (
  request: Request,
  filePath: string
): Promise<Response> => {
  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) return new Response("Not found", { status: 404 });

  const rangeHeader = request.headers.get("range");
  const range = parseByteRange(rangeHeader, fileStats.size);
  if (rangeHeader && !range) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${fileStats.size}` }
    });
  }

  const start = range?.start ?? 0;
  const end = range?.end ?? fileStats.size - 1;
  const contentLength = end - start + 1;
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers":
      "Accept-Ranges, Content-Length, Content-Range",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Length": String(contentLength),
    "Content-Type": mediaContentType(filePath)
  });
  if (range) {
    headers.set("Content-Range", `bytes ${start}-${end}/${fileStats.size}`);
  }
  if (request.method === "HEAD") {
    return new Response(null, {
      status: range ? HTTP_PARTIAL_CONTENT : HTTP_OK,
      headers
    });
  }

  const body = Readable.toWeb(
    createReadStream(filePath, { start, end })
  ) as ReadableStream<Uint8Array>;
  return new Response(body, {
    status: range ? HTTP_PARTIAL_CONTENT : HTTP_OK,
    headers
  });
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: "mago-media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

export const registerMediaProtocol = (
  repository: ProjectRepository,
  scriptProjects: ScriptProjectSnapshotRepository
): void => {
  const cloudStorageHosts = resolveCloudConfig().cloudStorageHosts;
  protocol.handle("mago-media", async (request) => {
    try {
      const url = new URL(request.url);
      const kind = url.hostname;
      if (kind === CLOUD_STORAGE_PROTOCOL_HOST) {
        return await cloudStorageProtocolResponse(request, cloudStorageHosts);
      }
      if (
        kind !== "asset" &&
        kind !== "thumbnail" &&
        kind !== "script-project" &&
        kind !== "script-project-thumbnail"
      ) {
        return new Response("Not found", { status: 404 });
      }
      const id = decodeURIComponent(url.pathname.slice(1));
      if (!id || id.includes("/") || id.includes("\\")) {
        return new Response("Not found", { status: 404 });
      }
      const filePath =
        kind === "script-project"
          ? await scriptProjects.resolveMediaPath(id)
          : kind === "script-project-thumbnail"
            ? await scriptProjects.resolveThumbnailMediaPath(id)
            : await repository.resolveMediaPath(kind, id);
      if (!filePath) return new Response("Not found", { status: 404 });
      const response = await mediaFileResponse(request, filePath);
      clearLibraryIssue(`media:${request.url}`);
      return response;
    } catch (error) {
      reportLibraryIssue({
        id: `media:${request.url}`,
        kind: "asset",
        message: `Media unavailable: ${request.url}. ${error instanceof Error ? error.message : String(error)}`
      });
      return new Response("Not found", { status: 404 });
    }
  });
};
