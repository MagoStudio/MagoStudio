import type { LocalVideoModelName } from "../../shared/contracts";

const IMAGE_TO_VIDEO_RESOLUTIONS_BY_MODEL = {
  seedance_2_i2v: ["480p", "720p", "1080p", "4k"],
  seedance_2_i2v_fast: ["480p", "720p"]
} as const satisfies Partial<Record<LocalVideoModelName, readonly string[]>>;

export type LocalImageToVideoModelName =
  keyof typeof IMAGE_TO_VIDEO_RESOLUTIONS_BY_MODEL;

export type ImageToVideoResolution =
  (typeof IMAGE_TO_VIDEO_RESOLUTIONS_BY_MODEL)[LocalImageToVideoModelName][number];

const DEFAULT_IMAGE_TO_VIDEO_RESOLUTION: ImageToVideoResolution = "720p";

export const isLocalImageToVideoModelName = (
  model: string
): model is LocalImageToVideoModelName =>
  Object.hasOwn(IMAGE_TO_VIDEO_RESOLUTIONS_BY_MODEL, model);

export const resolveImageToVideoResolution = (
  model: LocalImageToVideoModelName,
  requestedResolution: unknown
): ImageToVideoResolution => {
  const supportedResolutions: readonly ImageToVideoResolution[] =
    IMAGE_TO_VIDEO_RESOLUTIONS_BY_MODEL[model];
  return (
    supportedResolutions.find(
      (resolution) => resolution === requestedResolution
    ) ?? DEFAULT_IMAGE_TO_VIDEO_RESOLUTION
  );
};
