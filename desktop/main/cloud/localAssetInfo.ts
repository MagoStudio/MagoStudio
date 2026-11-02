import path from "node:path";

import { eq } from "drizzle-orm";

import { DatabaseManager } from "../database/databaseManager";
import { assets, scriptProjectMedia } from "../database/schema";

import { probeImageDimensions } from "./probeImageDimensions";

/**
 * What the cloud needs to know about a local asset before it can be mirrored.
 *
 * Registering an image with cloud Mago takes a name, an extension and
 * dimensions, all of which the local library already has. The renderer asks by
 * id and never learns the path.
 */

export interface LocalAssetInfo {
  id: string;
  name: string;
  /** Lower case, no leading dot, defaulting to png when the path has none. */
  extension: string;
  width: number | null;
  height: number | null;
  type: string;
  sizeBytes: number | null;
  /** Frames in the source, so a render range can be clamped to what exists. */
  frameCount: number | null;
}

const DEFAULT_IMAGE_EXTENSION = "png";

const hasKnownDimensions = (
  width: number | null | undefined,
  height: number | null | undefined
): boolean => (width ?? 0) > 0 && (height ?? 0) > 0;

const withProbedDimensions = async (
  info: LocalAssetInfo,
  sourcePath: string | null
): Promise<LocalAssetInfo> => {
  if (hasKnownDimensions(info.width, info.height) || !sourcePath) return info;
  const probedDimensions = await probeImageDimensions(sourcePath);
  return probedDimensions ? { ...info, ...probedDimensions } : info;
};

export const readLocalAssetInfo = async (
  manager: DatabaseManager,
  assetId: string,
  options: { libraryRoot?: string | null } = {}
): Promise<LocalAssetInfo | null> => {
  if (!manager.isOpen()) return null;
  const [asset] = await manager
    .get()
    .select()
    .from(assets)
    .where(eq(assets.id, assetId))
    .limit(1);
  if (!asset) {
    return readScriptProjectMediaInfo(manager, assetId, options.libraryRoot);
  }

  const extension = path
    .extname(asset.sourcePath)
    .replace(/^\./, "")
    .toLowerCase();

  return withProbedDimensions(
    {
      id: asset.id,
      name: asset.name,
      extension: extension || DEFAULT_IMAGE_EXTENSION,
      width: asset.width ?? null,
      height: asset.height ?? null,
      type: asset.type,
      sizeBytes: asset.sizeBytes ?? null,
      frameCount: asset.frameCount ?? null
    },
    asset.sourcePath || null
  );
};

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4"
};

export const contentTypeForExtension = (extension: string): string =>
  CONTENT_TYPES[extension.toLowerCase()] ?? "application/octet-stream";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

const readScriptProjectMediaInfo = async (
  manager: DatabaseManager,
  mediaId: string,
  libraryRoot: string | null | undefined
): Promise<LocalAssetInfo | null> => {
  const [media] = await manager
    .get()
    .select()
    .from(scriptProjectMedia)
    .where(eq(scriptProjectMedia.id, mediaId))
    .limit(1);
  if (!media) return null;
  const extension =
    path.extname(media.relativePath).replace(/^\./, "").toLowerCase() ||
    DEFAULT_IMAGE_EXTENSION;
  const sourcePath = libraryRoot
    ? await resolveScriptProjectMediaPath(manager, libraryRoot, mediaId)
    : null;
  return withProbedDimensions(
    {
      id: media.id,
      name: `${media.id}.${extension}`,
      extension,
      width: null,
      height: null,
      type: IMAGE_EXTENSIONS.has(extension) ? "IMAGE" : "VIDEO",
      sizeBytes: null,
      frameCount: null
    },
    sourcePath
  );
};

/** Where a script project's media lives, kept inside the library root. */
export const resolveScriptProjectMediaPath = async (
  manager: DatabaseManager,
  libraryRoot: string,
  mediaId: string
): Promise<string | null> => {
  if (!manager.isOpen()) return null;
  const [media] = await manager
    .get()
    .select()
    .from(scriptProjectMedia)
    .where(eq(scriptProjectMedia.id, mediaId))
    .limit(1);
  if (!media) return null;
  const root = path.resolve(libraryRoot);
  const resolved = path.resolve(root, media.relativePath);
  return resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
};
