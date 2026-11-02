/**
 * Rewrites an img2img render's settings so every image id in it is one the
 * cloud knows.
 *
 * The same problem `mirrorSources` solves for a video render, in the shape
 * img2img uses instead. Three slots carry local *asset* ids:
 *
 *   { input_image_id?: string, mask_image_id?: string, reference_images?: string[] }
 *
 * and submitting any of them unchanged is rejected, because the cloud has never seen
 * a local id. `input_image` is deliberately untouched: it is an inline data URL
 * of the frame, already mask-composited and cropped by the caller, so there is
 * nothing to mirror.
 *
 * Pure apart from the injected mirror function, so the id-walking is testable
 * without a network or a bridge.
 */

export interface Img2ImgSettingsPayload {
  input_image_id?: unknown;
  mask_image_id?: unknown;
  input_image?: unknown;
  reference_images?: unknown;
  [key: string]: unknown;
}

/** Local asset ids referenced by the image slots, in the order they appear. */
export const collectSettingsImageIds = (
  settings: Img2ImgSettingsPayload
): string[] => {
  const ids: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === "string" && value && !ids.includes(value)) {
      ids.push(value);
    }
  };

  add(settings.input_image_id);
  add(settings.mask_image_id);
  if (Array.isArray(settings.reference_images)) {
    for (const entry of settings.reference_images) add(entry);
  }
  return ids;
};

export const rewriteSettingsImageIds = (
  settings: Img2ImgSettingsPayload,
  mapping: Map<string, string>
): Img2ImgSettingsPayload => {
  const mapped = (value: unknown): unknown =>
    typeof value === "string" && mapping.has(value)
      ? mapping.get(value)
      : value;

  const next: Img2ImgSettingsPayload = { ...settings };
  if (typeof settings.input_image_id === "string") {
    next.input_image_id = mapped(settings.input_image_id);
  }
  if (typeof settings.mask_image_id === "string") {
    next.mask_image_id = mapped(settings.mask_image_id);
  }
  if (Array.isArray(settings.reference_images)) {
    next.reference_images = settings.reference_images.map(mapped);
  }
  return next;
};

/**
 * Mirrors every image the settings reference and returns them with cloud ids.
 * Sequential for the same reason as the video path: uploads compete for
 * bandwidth, and a handful of reference images is not worth parallelising.
 */
export const mirrorImg2ImgSettings = async (
  settings: Img2ImgSettingsPayload,
  mirrorImage: (localAssetId: string) => Promise<string>
): Promise<Img2ImgSettingsPayload> => {
  const ids = collectSettingsImageIds(settings);
  if (ids.length === 0) return settings;

  const mapping = new Map<string, string>();
  for (const id of ids) {
    mapping.set(id, await mirrorImage(id));
  }
  return rewriteSettingsImageIds(settings, mapping);
};
