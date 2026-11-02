import { ipcMain } from "electron";

import { IPC_CHANNELS } from "../../shared/contracts";
import { prepareCloudImageFile } from "../cloud/cloudImageFile";
import {
  CloudLinkKind,
  CloudLinkRepository
} from "../cloud/cloudLinkRepository";
import { CloudRenderJobRepository } from "../cloud/cloudRenderJobRepository";
import {
  CloudRenderSubmitService,
  IMAGE_OUTPUT_EXTENSION,
  isImageJobRequest
} from "../cloud/cloudRenderSubmitService";
import { downloadRenderOutput } from "../cloud/downloadRenderOutput";
import {
  contentTypeForExtension,
  readLocalAssetInfo,
  resolveScriptProjectMediaPath
} from "../cloud/localAssetInfo";
import { toCloudImageOutputExtension } from "../cloud/toCloudImageOutputExtension";
import {
  uploadBytesToPresignedUrl,
  uploadFileToPresignedUrl
} from "../cloud/uploadFile";
import { UploadService } from "../cloud/uploadService";
import { DatabaseManager } from "../database/databaseManager";
import { ProjectRepository } from "../database/projectRepository";

import { requireTrustedSender } from "./trustedSender";

/**
 * The main-process half of cloud mirroring.
 *
 * The renderer runs the ensure-chain because that is where the authenticated API
 * client lives, but it never touches the filesystem: it asks for an asset to be
 * prepared by id, and hands back only a presigned URL. Native paths never cross
 * the bridge.
 */

const KINDS: CloudLinkKind[] = ["project", "timeline", "asset"];

const requireKind = (value: unknown): CloudLinkKind => {
  if (typeof value !== "string" || !KINDS.includes(value as CloudLinkKind)) {
    throw new Error("Unknown cloud link kind");
  }
  return value as CloudLinkKind;
};

const requireId = (value: unknown, name: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
};

/** IPC's structured clone delivers an ArrayBuffer, or a typed array if the
 * renderer sent one; both are accepted, nothing else is. */
const requireBytes = (value: unknown): Buffer => {
  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }
  if (Object.prototype.toString.call(value) === "[object ArrayBuffer]") {
    return Buffer.from(value as ArrayBuffer);
  }
  throw new Error("bytes must be an ArrayBuffer");
};

const optionalSeconds = (value: unknown, name: string): number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return value;
};

export const registerCloudHandlers = (options: {
  links: CloudLinkRepository;
  uploads: UploadService;
  repository: ProjectRepository;
  renderJobs: CloudRenderJobRepository;
  renderSubmits: CloudRenderSubmitService;
  databaseManager: DatabaseManager;
  getLibraryRoot: () => Promise<string | null>;
}): void => {
  const { links, uploads, repository, renderJobs, renderSubmits } = options;

  ipcMain.handle(IPC_CHANNELS.cloudLinkGet, async (event, kind, localId) => {
    requireTrustedSender(event);
    return links.get(requireKind(kind), requireId(localId, "localId"));
  });

  ipcMain.handle(IPC_CHANNELS.cloudLinkPut, async (event, input) => {
    requireTrustedSender(event);
    const value = (input ?? {}) as Record<string, unknown>;
    await links.put({
      kind: requireKind(value.kind),
      localId: requireId(value.localId, "localId"),
      cloudId: requireId(value.cloudId, "cloudId"),
      data:
        value.data && typeof value.data === "object"
          ? (value.data as Record<string, unknown>)
          : undefined
    });
  });

  ipcMain.handle(IPC_CHANNELS.cloudLinkPatch, async (event, input) => {
    requireTrustedSender(event);
    const value = (input ?? {}) as Record<string, unknown>;
    await links.patchData(
      requireKind(value.kind),
      requireId(value.localId, "localId"),
      (value.patch ?? {}) as Record<string, unknown>
    );
  });

  ipcMain.handle(IPC_CHANNELS.cloudPrepareUpload, async (event, input) => {
    requireTrustedSender(event);
    const value = (input ?? {}) as Record<string, unknown>;
    const assetId = requireId(value.assetId, "assetId");
    // Resolved here rather than passed in, so the renderer never learns a path.
    const sourcePath = await repository.resolveMediaPath("asset", assetId);
    if (!sourcePath) throw new Error("The local asset could not be found");

    const prepared = await uploads.prepare({
      assetId,
      sourcePath,
      trimStartSeconds: optionalSeconds(
        value.trimStartSeconds,
        "trimStartSeconds"
      ),
      trimEndSeconds: optionalSeconds(value.trimEndSeconds, "trimEndSeconds"),
      force: value.force === true
    });
    return { sizeBytes: prepared.sizeBytes, encoded: prepared.encoded };
  });

  ipcMain.handle(IPC_CHANNELS.cloudUploadPrepared, async (event, input) => {
    requireTrustedSender(event);
    const value = (input ?? {}) as Record<string, unknown>;
    const assetId = requireId(value.assetId, "assetId");
    const presignedUrl = requireId(value.presignedUrl, "presignedUrl");
    const sourcePath = await repository.resolveMediaPath("asset", assetId);
    if (!sourcePath) throw new Error("The local asset could not be found");

    // Reuses the cached encode rather than re-encoding for the upload.
    const prepared = await uploads.prepare({
      assetId,
      sourcePath,
      trimStartSeconds: optionalSeconds(
        value.trimStartSeconds,
        "trimStartSeconds"
      ),
      trimEndSeconds: optionalSeconds(value.trimEndSeconds, "trimEndSeconds")
    });
    await uploads.upload({
      filePath: prepared.filePath,
      presignedUrl,
      onProgress: (fraction) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send(IPC_CHANNELS.cloudUploadProgress, {
            assetId,
            fraction
          });
        }
      }
    });
  });

  ipcMain.handle(IPC_CHANNELS.cloudAssetInfo, async (event, assetId) => {
    requireTrustedSender(event);
    const info = await readLocalAssetInfo(
      options.databaseManager,
      requireId(assetId, "assetId"),
      { libraryRoot: await options.getLibraryRoot() }
    );
    if (!info) return null;
    return {
      id: info.id,
      name: info.name,
      extension: info.extension,
      width: info.width,
      height: info.height,
      type: info.type,
      frameCount: info.frameCount
    };
  });

  const byteUploads = new Map<string, AbortController>();
  ipcMain.handle(IPC_CHANNELS.cloudUploadBytes, async (event, input) => {
    requireTrustedSender(event);
    const value = (input ?? {}) as Record<string, unknown>;
    const uploadId = requireId(value.uploadId, "uploadId");
    const presignedUrl = requireId(value.presignedUrl, "presignedUrl");
    const contentType = requireId(value.contentType, "contentType");
    const bytes = requireBytes(value.bytes);
    const controller = new AbortController();
    byteUploads.get(uploadId)?.abort();
    byteUploads.set(uploadId, controller);
    try {
      await uploadBytesToPresignedUrl({
        bytes,
        presignedUrl,
        contentType,
        signal: controller.signal,
        onProgress: (fraction) => {
          if (!event.sender.isDestroyed()) {
            event.sender.send(IPC_CHANNELS.cloudUploadProgress, {
              assetId: uploadId,
              fraction
            });
          }
        }
      });
    } finally {
      if (byteUploads.get(uploadId) === controller) {
        byteUploads.delete(uploadId);
      }
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.cloudCancelUploadBytes,
    async (event, uploadId: unknown) => {
      requireTrustedSender(event);
      byteUploads.get(requireId(uploadId, "uploadId"))?.abort();
    }
  );

  ipcMain.handle(IPC_CHANNELS.cloudUploadAsset, async (event, input) => {
    requireTrustedSender(event);
    const value = (input ?? {}) as Record<string, unknown>;
    const assetId = requireId(value.assetId, "assetId");
    const presignedUrl = requireId(value.presignedUrl, "presignedUrl");
    const [libraryPath, info] = await Promise.all([
      repository.resolveMediaPath("asset", assetId),
      readLocalAssetInfo(options.databaseManager, assetId)
    ]);
    const libraryRoot = libraryPath ? null : await options.getLibraryRoot();
    const sourcePath =
      libraryPath ??
      (libraryRoot
        ? await resolveScriptProjectMediaPath(
            options.databaseManager,
            libraryRoot,
            assetId
          )
        : null);
    if (!sourcePath || !info) {
      throw new Error("The local asset could not be found");
    }
    const imageLibraryRoot =
      info.type.toUpperCase() === "IMAGE"
        ? (libraryRoot ?? (await options.getLibraryRoot()))
        : null;
    const uploadFile = imageLibraryRoot
      ? await prepareCloudImageFile({
          assetId,
          sourcePath,
          extension: info.extension,
          libraryRoot: imageLibraryRoot
        })
      : {
          filePath: sourcePath,
          contentType: contentTypeForExtension(info.extension)
        };
    await uploadFileToPresignedUrl({
      filePath: uploadFile.filePath,
      presignedUrl,
      contentType: uploadFile.contentType,
      onProgress: (fraction) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send(IPC_CHANNELS.cloudUploadProgress, {
            assetId,
            fraction
          });
        }
      }
    });
  });

  ipcMain.handle(IPC_CHANNELS.cloudRenderRegister, async (event, input) => {
    requireTrustedSender(event);
    const value = (input ?? {}) as Record<string, unknown>;
    const range = value.frameRange;
    if (
      !Array.isArray(range) ||
      range.length !== 2 ||
      !range.every((entry) => typeof entry === "number" && entry >= 0)
    ) {
      throw new Error("frameRange must be two non-negative numbers");
    }
    const fps = value.fps;
    if (typeof fps !== "number" || !Number.isFinite(fps) || fps <= 0) {
      throw new Error("fps must be a positive number");
    }
    return renderSubmits.register({
      outputTrackId: requireId(value.outputTrackId, "outputTrackId"),
      sourceAssetId: requireId(value.sourceAssetId, "sourceAssetId"),
      model: requireId(value.model, "model"),
      frameRange: [range[0] as number, range[1] as number],
      fps,
      cloudAssetId: requireId(value.cloudAssetId, "cloudAssetId"),
      cloudClipId:
        typeof value.cloudClipId === "string" ? value.cloudClipId : null,
      cloudOutputLayerId:
        typeof value.cloudOutputLayerId === "string" && value.cloudOutputLayerId
          ? value.cloudOutputLayerId
          : null,
      settings:
        value.settings && typeof value.settings === "object"
          ? (value.settings as Record<string, unknown>)
          : {},
      sources:
        value.sources &&
        typeof value.sources === "object" &&
        !Array.isArray(value.sources)
          ? (value.sources as Record<string, unknown>)
          : undefined,
      width: typeof value.width === "number" ? value.width : undefined,
      height: typeof value.height === "number" ? value.height : undefined
    });
  });

  ipcMain.handle(
    IPC_CHANNELS.cloudImageRenderRegister,
    async (event, input) => {
      requireTrustedSender(event);
      const value = (input ?? {}) as Record<string, unknown>;
      const frame = value.frame;
      if (typeof frame !== "number" || !Number.isInteger(frame) || frame < 0) {
        throw new Error("frame must be a non-negative integer");
      }
      return renderSubmits.registerImage({
        projectId: requireId(value.projectId, "projectId"),
        shotId: requireId(value.shotId, "shotId"),
        sourceAssetId: requireId(value.sourceAssetId, "sourceAssetId"),
        model: requireId(value.model, "model"),
        frame,
        name: requireId(value.name, "name"),
        cloudAssetId: requireId(value.cloudAssetId, "cloudAssetId"),
        cloudClipId: requireId(value.cloudClipId, "cloudClipId"),
        settings:
          value.settings && typeof value.settings === "object"
            ? (value.settings as Record<string, unknown>)
            : {}
      });
    }
  );

  ipcMain.handle(IPC_CHANNELS.cloudRenderListActive, async (event) => {
    requireTrustedSender(event);
    const rows = await renderJobs.listActive();
    // The local ids are what the queue UI matches a track on, so they travel
    // with the job rather than being looked up again in the renderer.
    return rows.map((row) => ({
      id: row.id,
      cloudAssetId: row.cloudAssetId,
      cloudClipId: row.cloudClipId,
      kind: isImageJobRequest(row.request) ? "img2img" : "video",
      projectId: row.projectId,
      shotId: row.shotId,
      model: row.model,
      status: row.status,
      progress: row.progress,
      assetId: row.assetId,
      trackId: row.trackId,
      clipId: row.clipId
    }));
  });

  ipcMain.handle(IPC_CHANNELS.cloudRenderListQueue, async (event) => {
    requireTrustedSender(event);
    return renderJobs.listQueue();
  });

  ipcMain.handle(IPC_CHANNELS.cloudRenderSetStatus, async (event, input) => {
    requireTrustedSender(event);
    const value = (input ?? {}) as Record<string, unknown>;
    await renderJobs.update(requireId(value.jobId, "jobId"), {
      status: requireId(value.status, "status"),
      progress: typeof value.progress === "number" ? value.progress : undefined
    });
  });

  ipcMain.handle(IPC_CHANNELS.cloudRenderFinish, async (event, input) => {
    requireTrustedSender(event);
    const value = (input ?? {}) as Record<string, unknown>;
    const jobId = requireId(value.jobId, "jobId");
    const url = requireId(value.url, "url");
    const libraryRoot = await options.getLibraryRoot();
    if (!libraryRoot) throw new Error("Choose a Mago library folder first");

    // An img2img output is a still, so it must not land under a .mp4 name.
    const job = await renderJobs.get(jobId);
    const extension = isImageJobRequest(job?.request)
      ? toCloudImageOutputExtension(url, IMAGE_OUTPUT_EXTENSION)
      : undefined;

    const downloaded = await downloadRenderOutput({
      url,
      libraryRoot,
      jobId,
      extension,
      onProgress: (fraction) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send(IPC_CHANNELS.cloudUploadProgress, {
            assetId: jobId,
            fraction
          });
        }
      }
    });
    await renderSubmits.complete({
      jobId,
      relativePath: downloaded.relativePath,
      sizeBytes: downloaded.sizeBytes
    });
  });

  ipcMain.handle(IPC_CHANNELS.cloudRenderFail, async (event, input) => {
    requireTrustedSender(event);
    const value = (input ?? {}) as Record<string, unknown>;
    await renderSubmits.fail({
      jobId: requireId(value.jobId, "jobId"),
      message:
        typeof value.message === "string" && value.message
          ? value.message
          : "The cloud render failed"
    });
  });
};
