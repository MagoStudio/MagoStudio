import { ipcMain } from "electron";

import {
  IPC_CHANNELS,
  type LocalImageImport,
  type LocalShotCreateInput,
  type LocalShotUpdateInput,
  type LocalTrackCreateInput,
  type LocalTrackUpdateInput,
  type LocalVideoImport
} from "../../shared/contracts";
import { CloudProjectMirrorRepository } from "../database/cloudProjectMirrorRepository";
import { DatabaseManager } from "../database/databaseManager";
import { ProjectRepository } from "../database/projectRepository";
import { LibrarySettings } from "../librarySettings";

import { requireTrustedSender } from "./trustedSender";

const MAX_IMPORT_VIDEOS = 100;

const requireString = (value: unknown, name: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
};

const requireRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("settings must be an object");
  }
  return value as Record<string, unknown>;
};

const NO_STAR_RATING = 0;
const ONE_STAR_RATING = 10;
const TWO_STAR_RATING = 20;
const THREE_STAR_RATING = 30;
const STAR_RATINGS_STORED_IN_TENS = new Set([
  NO_STAR_RATING,
  ONE_STAR_RATING,
  TWO_STAR_RATING,
  THREE_STAR_RATING
]);

const optionalRating = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !STAR_RATINGS_STORED_IN_TENS.has(value)) {
    throw new Error("rating must be 0, 10, 20, or 30");
  }
  return value;
};

const requireRate = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("rate must be a non-negative integer");
  }
  return value;
};

const validateVideo = (value: unknown): LocalVideoImport => {
  const video = requireRecord(value);
  const number = (key: string): number => {
    const candidate = video[key];
    if (
      typeof candidate !== "number" ||
      !Number.isFinite(candidate) ||
      candidate < 0
    ) {
      throw new Error(`${key} must be a non-negative finite number`);
    }
    return candidate;
  };
  return {
    sourcePath: requireString(video.sourcePath, "sourcePath"),
    name: requireString(video.name, "name"),
    durationSeconds: number("durationSeconds"),
    fps: number("fps"),
    width: number("width"),
    height: number("height"),
    frameCount: number("frameCount"),
    thumbnailDataUrl: requireString(video.thumbnailDataUrl, "thumbnailDataUrl"),
    trimStartSeconds:
      video.trimStartSeconds === undefined
        ? undefined
        : number("trimStartSeconds"),
    trimEndSeconds:
      video.trimEndSeconds === undefined ? undefined : number("trimEndSeconds")
  };
};

export const registerProjectHandlers = (
  repository: ProjectRepository,
  cloudProjects: CloudProjectMirrorRepository,
  databaseManager: DatabaseManager,
  settings: LibrarySettings,
  /** Told about every imported image, e.g. to caption it. Must not throw. */
  onImageImported?: (assetId: string) => void
): void => {
  const ensureDatabase = async (required = false): Promise<boolean> => {
    if (databaseManager.isOpen()) return true;
    const libraryRoot = await settings.getLibraryRoot();
    if (!libraryRoot) {
      if (required) throw new Error("Choose a Mago library folder first");
      return false;
    }
    await databaseManager.open(libraryRoot);
    return true;
  };

  ipcMain.handle(IPC_CHANNELS.assetsGet, async (event, assetId: unknown) => {
    requireTrustedSender(event);
    if (!(await ensureDatabase())) return null;
    return repository.getAsset(requireString(assetId, "assetId"));
  });
  ipcMain.handle(
    IPC_CHANNELS.assetsImportImage,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase(true);
      const input = requireRecord(value);
      const number = (name: string) => {
        const candidate = input[name];
        if (
          typeof candidate !== "number" ||
          !Number.isFinite(candidate) ||
          candidate <= 0
        ) {
          throw new Error(`${name} must be a positive number`);
        }
        return candidate;
      };
      const asset = await repository.importImage({
        projectId: requireString(input.projectId, "projectId"),
        sourcePath: requireString(input.sourcePath, "sourcePath"),
        name: requireString(input.name, "name"),
        width: number("width"),
        height: number("height"),
        thumbnailDataUrl: requireString(
          input.thumbnailDataUrl,
          "thumbnailDataUrl"
        )
      } satisfies LocalImageImport);
      onImageImported?.(asset.id);
      return asset;
    }
  );

  ipcMain.handle(IPC_CHANNELS.projectsList, async (event) => {
    requireTrustedSender(event);
    if (!(await ensureDatabase())) return [];
    return repository.list();
  });
  ipcMain.handle(IPC_CHANNELS.projectsListAll, async (event) => {
    requireTrustedSender(event);
    if (!(await ensureDatabase())) return [];
    return repository.listAll();
  });
  ipcMain.handle(
    IPC_CHANNELS.projectsGet,
    async (event, projectId: unknown) => {
      requireTrustedSender(event);
      if (!(await ensureDatabase())) return null;
      return repository.get(requireString(projectId, "projectId"));
    }
  );
  ipcMain.handle(
    IPC_CHANNELS.projectsMirrorCloud,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase(true);
      const input = requireRecord(value);
      const project = requireRecord(input.project);
      return cloudProjects.put({
        project,
        includeContent: input.includeContent === true
      });
    }
  );
  ipcMain.handle(
    IPC_CHANNELS.projectsCancelCloudMirror,
    async (event, projectId: unknown) => {
      requireTrustedSender(event);
      cloudProjects.cancel(requireString(projectId, "projectId"));
    }
  );
  ipcMain.handle(
    IPC_CHANNELS.projectsCacheCloudAsset,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase(true);
      const input = requireRecord(value);
      return cloudProjects.cacheAsset({
        projectId: requireString(input.projectId, "projectId"),
        assetId: requireString(input.assetId, "assetId"),
        isImage: input.isImage === true,
        urls: {
          sourceUrl:
            typeof input.sourceUrl === "string" ? input.sourceUrl : undefined,
          thumbnailUrl:
            typeof input.thumbnailUrl === "string"
              ? input.thumbnailUrl
              : undefined
        }
      });
    }
  );
  ipcMain.handle(
    IPC_CHANNELS.projectsCancelCloudAsset,
    async (event, projectId: unknown, assetId: unknown) => {
      requireTrustedSender(event);
      cloudProjects.cancelAsset(
        requireString(projectId, "projectId"),
        requireString(assetId, "assetId")
      );
    }
  );
  ipcMain.handle(IPC_CHANNELS.projectsCreate, async (event, value: unknown) => {
    requireTrustedSender(event);
    await ensureDatabase(true);
    const input = requireRecord(value);
    return repository.create({
      name: requireString(input.name, "name"),
      description:
        typeof input.description === "string" ? input.description : "",
      settings: requireRecord(input.settings)
    });
  });
  ipcMain.handle(IPC_CHANNELS.projectsUpdate, async (event, value: unknown) => {
    requireTrustedSender(event);
    await ensureDatabase(true);
    const input = requireRecord(value);
    return repository.update({
      projectId: requireString(input.projectId, "projectId"),
      name: requireString(input.name, "name"),
      description:
        typeof input.description === "string" ? input.description : "",
      settings: requireRecord(input.settings)
    });
  });
  ipcMain.handle(
    IPC_CHANNELS.projectsDelete,
    async (event, projectId: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase(true);
      await repository.delete(requireString(projectId, "projectId"));
    }
  );
  ipcMain.handle(
    IPC_CHANNELS.projectsImportVideos,
    async (event, value: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase(true);
      const input = requireRecord(value);
      if (!Array.isArray(input.videos) || input.videos.length === 0) {
        throw new Error("At least one video is required");
      }
      if (input.videos.length > MAX_IMPORT_VIDEOS)
        throw new Error("Too many videos selected");
      return repository.importVideos(
        requireString(input.projectId, "projectId"),
        input.videos.map(validateVideo)
      );
    }
  );
  ipcMain.handle(IPC_CHANNELS.tracksCreate, async (event, value: unknown) => {
    requireTrustedSender(event);
    await ensureDatabase(true);
    const input = requireRecord(value);
    const parentTrackOrder = input.parentTrackOrder;
    if (
      typeof parentTrackOrder !== "number" ||
      !Number.isInteger(parentTrackOrder)
    ) {
      throw new Error("parentTrackOrder must be an integer");
    }
    return repository.createTrack({
      shotId: requireString(input.shotId, "shotId"),
      name: requireString(input.name, "name"),
      type: requireString(input.type, "type"),
      data: requireRecord(input.data),
      parentTrackOrder
    } satisfies LocalTrackCreateInput);
  });
  ipcMain.handle(IPC_CHANNELS.tracksUpdate, async (event, value: unknown) => {
    requireTrustedSender(event);
    await ensureDatabase(true);
    const input = requireRecord(value);
    return repository.updateTrack({
      trackId: requireString(input.trackId, "trackId"),
      name: requireString(input.name, "name"),
      data: requireRecord(input.data),
      rating: optionalRating(input.rating)
    } satisfies LocalTrackUpdateInput);
  });
  ipcMain.handle(IPC_CHANNELS.tracksDelete, async (event, trackId: unknown) => {
    requireTrustedSender(event);
    await ensureDatabase(true);
    await repository.deleteTrack(requireString(trackId, "trackId"));
  });
  ipcMain.handle(IPC_CHANNELS.shotsCreate, async (event, value: unknown) => {
    requireTrustedSender(event);
    await ensureDatabase(true);
    const input = requireRecord(value);
    return repository.createShot({
      projectId: requireString(input.projectId, "projectId"),
      name: requireString(input.name, "name")
    } satisfies LocalShotCreateInput);
  });
  ipcMain.handle(IPC_CHANNELS.shotsUpdate, async (event, value: unknown) => {
    requireTrustedSender(event);
    await ensureDatabase(true);
    const input = requireRecord(value);
    return repository.updateShot({
      shotId: requireString(input.shotId, "shotId"),
      name: requireString(input.name, "name"),
      settings: requireRecord(input.settings)
    } satisfies LocalShotUpdateInput);
  });
  ipcMain.handle(IPC_CHANNELS.shotsDelete, async (event, shotId: unknown) => {
    requireTrustedSender(event);
    await ensureDatabase(true);
    await repository.deleteShot(requireString(shotId, "shotId"));
  });
  ipcMain.handle(IPC_CHANNELS.assetsUpdate, async (event, value: unknown) => {
    requireTrustedSender(event);
    await ensureDatabase(true);
    const input = requireRecord(value);
    return repository.updateAsset({
      assetId: requireString(input.assetId, "assetId"),
      rate: requireRate(input.rate)
    });
  });
  ipcMain.handle(
    IPC_CHANNELS.projectsListShots,
    async (event, projectId: unknown) => {
      requireTrustedSender(event);
      if (!(await ensureDatabase())) return [];
      return repository.listShots(requireString(projectId, "projectId"));
    }
  );
  ipcMain.handle(
    IPC_CHANNELS.projectsStats,
    async (event, projectId: unknown) => {
      requireTrustedSender(event);
      await ensureDatabase(true);
      return repository.projectStats(requireString(projectId, "projectId"));
    }
  );
};
