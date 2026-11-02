const objectValue = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const arrayValue = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.flatMap((item) => (objectValue(item) ? [item] : []))
    : [];

const legacySettingsAssetIds = (
  settings: Record<string, unknown> | undefined
): string[] => {
  if (!settings) return [];
  const assetIds: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === "string" && value) assetIds.push(value);
  };
  const addMany = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(add);
  };
  add(settings.ipadapter_image_source);
  for (const element of arrayValue(settings.elements)) {
    const references = element.reference_image_id;
    Array.isArray(references) ? references.forEach(add) : add(references);
    add(element.frontal_image_id);
  }
  add(settings.image_id);
  add(settings.reference_image_id);
  add(settings.frontal_image_id);
  add(settings.input_image_id);
  add(settings.mask_image_id);
  addMany(settings.image_ids);
  addMany(settings.reference_image_ids);
  addMany(settings.reference_images);
  return assetIds;
};

const renderReferences = (
  clip: Record<string, unknown>
): { cloudIds: string[]; legacyIds: string[] } => {
  const asset = objectValue(clip.asset);
  const assetData = objectValue(asset?.data);
  const renderData = objectValue(assetData?.data) ?? assetData;
  const sources = objectValue(renderData?.sources);
  const cloudIds: string[] = [];
  const addCloudId = (value: unknown) => {
    if (typeof value === "string" && value) cloudIds.push(value);
  };
  addCloudId(sources?.input_mask);
  addCloudId(sources?.ipadapter_image_source);
  for (const image of arrayValue(sources?.images)) {
    addCloudId(image.asset_id);
  }
  const renderSettings = objectValue(renderData?.render_settings);
  return {
    cloudIds,
    legacyIds: legacySettingsAssetIds(objectValue(renderSettings?.magov2))
  };
};

export const collectCloudReferenceAssetIds = (
  timelines: Record<string, unknown>[]
): Set<string> => {
  const assetIds = new Set<string>();

  for (const timeline of timelines) {
    for (const layer of arrayValue(timeline.layers)) {
      for (const clip of arrayValue(layer.clips)) {
        const { cloudIds, legacyIds } = renderReferences(clip);
        const ids = cloudIds.length > 0 ? cloudIds : legacyIds;
        ids.forEach((assetId) => assetIds.add(assetId));
      }
    }
  }

  return assetIds;
};

export const collectCloudReferenceAssetIdMappings = (
  timelines: Record<string, unknown>[]
): Map<string, string> => {
  const mappings = new Map<string, string>();
  for (const timeline of timelines) {
    for (const layer of arrayValue(timeline.layers)) {
      for (const clip of arrayValue(layer.clips)) {
        const { cloudIds, legacyIds } = renderReferences(clip);
        if (cloudIds.length !== legacyIds.length) continue;
        legacyIds.forEach((localId, index) => {
          const cloudId = cloudIds[index];
          if (cloudId && localId !== cloudId) mappings.set(localId, cloudId);
        });
      }
    }
  }
  return mappings;
};
