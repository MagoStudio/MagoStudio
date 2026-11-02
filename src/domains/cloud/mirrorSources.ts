/**
 * Rewrites a render's `sources` so every id in it is one the cloud knows.
 *
 * `sources` mixes a track id with image asset ids:
 *
 *   { video, input_mask?, images?: [{ asset_id, type, index? }],
 *     ipadapter_image_source? }
 *
 * The video slot is a *layer* the mirror already creates. The image slots are
 * local *asset* ids, and submitting them unchanged is rejected with
 * "Invalid source 'images': asset not found or inaccessible". Each one has to be
 * mirrored and swapped for its cloud id.
 *
 * Pure apart from the injected mirror function, so the id-walking is testable
 * without a network or a bridge.
 */

export interface SourcesPayload {
  video?: unknown;
  input_mask?: unknown;
  images?: { asset_id?: unknown; type?: unknown; index?: unknown }[];
  ipadapter_image_source?: unknown;
  [key: string]: unknown;
}

/** Local asset ids referenced by the image slots, in the order they appear. */
export const collectSourceImageIds = (sources: SourcesPayload): string[] => {
  const ids: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === "string" && value && !ids.includes(value)) {
      ids.push(value);
    }
  };

  add(sources.input_mask);
  add(sources.ipadapter_image_source);
  if (Array.isArray(sources.images)) {
    for (const entry of sources.images) add(entry?.asset_id);
  }
  return ids;
};

export const rewriteSourceImageIds = (
  sources: SourcesPayload,
  mapping: Map<string, string>
): SourcesPayload => {
  const mapped = (value: unknown): unknown =>
    typeof value === "string" && mapping.has(value)
      ? mapping.get(value)
      : value;

  const next: SourcesPayload = { ...sources };
  if (typeof sources.input_mask === "string") {
    next.input_mask = mapped(sources.input_mask);
  }
  if (typeof sources.ipadapter_image_source === "string") {
    next.ipadapter_image_source = mapped(sources.ipadapter_image_source);
  }
  if (Array.isArray(sources.images)) {
    next.images = sources.images.map((entry) => ({
      ...entry,
      asset_id: mapped(entry?.asset_id)
    }));
  }
  return next;
};

/**
 * Mirrors every image a render references and returns `sources` with cloud ids.
 * Sequential on purpose: uploads compete for bandwidth with each other and with
 * the video, and a handful of reference images is not worth parallelising.
 */
export const mirrorSourceImages = async (
  sources: SourcesPayload,
  mirrorImage: (localAssetId: string) => Promise<string>
): Promise<SourcesPayload> => {
  const ids = collectSourceImageIds(sources);
  if (ids.length === 0) return sources;

  const mapping = new Map<string, string>();
  for (const id of ids) {
    mapping.set(id, await mirrorImage(id));
  }
  return rewriteSourceImageIds(sources, mapping);
};
