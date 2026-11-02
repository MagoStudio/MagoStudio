import { resolveStorageScopeParts } from "./storageScope";

export type RenderSettingsStorageMode =
  | "render"
  | "upscale"
  | "mask"
  | "image-to-video";

export const buildRenderSettingsStorageKey = ({
  userId,
  projectId,
  shotId,
  mode
}: {
  userId: string | undefined;
  projectId: string | undefined;
  shotId: string | undefined;
  mode: RenderSettingsStorageMode;
}): string | undefined => {
  const scopeParts = resolveStorageScopeParts(
    mode === "image-to-video"
      ? { level: "project", userId, projectId }
      : { level: "shot", userId, projectId, shotId }
  );

  if (!scopeParts) {
    return undefined;
  }

  return [...scopeParts, mode].join("-");
};
