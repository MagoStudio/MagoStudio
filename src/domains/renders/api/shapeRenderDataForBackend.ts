import { MAX_SOURCE_IMAGES, SourceImage } from "@domains/renders/types";
import { buildMagoImageSources } from "@domains/renders/utils/buildMagoImageSources";
import { doesModelSupportTagsInPrompt } from "@domains/renders/utils/doesModelSupportTagsInPrompt";
import { isImageToVideoModel } from "@domains/renders/utils/isImageToVideoModel";
import { isMagoEngine } from "@domains/renders/utils/isMagoEngine";
import { VideoEngine, VideoSettings } from "@models/video/types";

export const stripLegacySourceSettingKey = (
  settings: Record<string, unknown>
): Record<string, unknown> => {
  const { ipadapter_image_source: _legacy, ...rest } = settings;
  return rest;
};

const STALE_BACKEND_REFERENCE_KEYS = ["reference_image_paths", "image_paths"];

export const stripStaleBackendReferenceKeys = (
  settings: Record<string, unknown>
): Record<string, unknown> => {
  const rest = { ...settings };
  for (const key of STALE_BACKEND_REFERENCE_KEYS) {
    delete rest[key];
  }
  return rest;
};

interface VideoSourcesPayload {
  video?: string;
  input_mask?: string;
  images?: Array<{
    asset_id: string;
    type: SourceImage["type"];
    index?: number;
  }>;
  ipadapter_image_source?: string;
}

interface NoSourcesPayload {
  video?: never;
  input_mask?: never;
  images?: never;
  ipadapter_image_source?: never;
}

export type SourcesPayload = VideoSourcesPayload | NoSourcesPayload;

interface ShapeSourcesInput {
  inputTrackId: string;
  inputMask?: string;
  sources: SourceImage[];
  engine: VideoEngine | string | undefined;
  legacyIpadapterImageSource?: string;
  hasModelOwnedSources?: boolean;
  omitSourceVideo?: boolean;
}

const orderSourceImages = (entries: SourceImage[]): SourceImage[] => {
  const keyFrames = entries
    .filter((entry) => entry.type === "key_frame")
    .slice()
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const rest = entries.filter((entry) => entry.type !== "key_frame");
  return [...keyFrames, ...rest];
};

const isElementGroupEntry = (entry: SourceImage): boolean =>
  entry.type === "element_reference" || entry.type === "element_frontal";

const groupSourceImagesKeepingElementPairsTogether = (
  entries: SourceImage[]
): SourceImage[][] => {
  const groups: SourceImage[][] = [];
  const elementPairIndexToGroup = new Map<number, SourceImage[]>();

  for (const entry of entries) {
    if (!isElementGroupEntry(entry)) {
      groups.push([entry]);
      continue;
    }

    const elementPairIndex = entry.index ?? 0;
    const existingGroup = elementPairIndexToGroup.get(elementPairIndex);
    if (existingGroup) {
      existingGroup.push(entry);
      continue;
    }

    const newGroup = [entry];
    elementPairIndexToGroup.set(elementPairIndex, newGroup);
    groups.push(newGroup);
  }

  return groups;
};

const truncateSourceImagesKeepingElementPairsIntact = (
  entries: SourceImage[],
  maxCount: number
): SourceImage[] => {
  const groups = groupSourceImagesKeepingElementPairsTogether(entries);
  const truncated: SourceImage[] = [];

  for (const group of groups) {
    if (truncated.length + group.length > maxCount) break;
    truncated.push(...group);
  }

  return truncated;
};

const INDEXED_ROLES = new Set<SourceImage["type"]>([
  "key_frame",
  "element_reference",
  "element_frontal"
]);

const toPayloadImage = (
  entry: SourceImage
): { asset_id: string; type: SourceImage["type"]; index?: number } => {
  const out: {
    asset_id: string;
    type: SourceImage["type"];
    index?: number;
  } = {
    asset_id: entry.asset_id,
    type: entry.type
  };
  if (INDEXED_ROLES.has(entry.type) && typeof entry.index === "number") {
    out.index = entry.index;
  }
  return out;
};

const pickFirstAssetId = (
  sources: SourceImage[],
  legacy?: string
): string | undefined => {
  const firstReference = sources.find(
    (entry) => entry.type === "reference_frame"
  );
  if (firstReference) return firstReference.asset_id;
  if (sources.length > 0) return sources[0].asset_id;
  return legacy;
};

export const shapeSourcesForBackend = ({
  inputTrackId,
  inputMask,
  sources,
  engine,
  legacyIpadapterImageSource,
  hasModelOwnedSources,
  omitSourceVideo
}: ShapeSourcesInput): SourcesPayload => {
  if (isImageToVideoModel(engine)) return {};

  const base: VideoSourcesPayload = omitSourceVideo
    ? {}
    : { video: inputTrackId };
  if (inputMask) base.input_mask = inputMask;

  if (isMagoEngine(engine)) {
    const fromLegacy: SourceImage[] =
      sources.length === 0 && legacyIpadapterImageSource
        ? [{ asset_id: legacyIpadapterImageSource, type: "reference_frame" }]
        : sources;
    const mapped = buildMagoImageSources(engine, fromLegacy);
    const ordered = truncateSourceImagesKeepingElementPairsIntact(
      orderSourceImages(mapped),
      MAX_SOURCE_IMAGES
    );
    if (ordered.length > 0) {
      base.images = ordered.map(toPayloadImage);
    }
    return base;
  }

  if (hasModelOwnedSources) {
    const ordered = truncateSourceImagesKeepingElementPairsIntact(
      orderSourceImages(sources),
      MAX_SOURCE_IMAGES
    );
    if (ordered.length > 0) {
      base.images = ordered.map(toPayloadImage);
    }
    return base;
  }

  if (doesModelSupportTagsInPrompt(engine)) {
    return base;
  }

  const ipadapterAssetId = pickFirstAssetId(
    sources,
    legacyIpadapterImageSource
  );
  if (ipadapterAssetId) {
    base.ipadapter_image_source = ipadapterAssetId;
  }
  return base;
};

export interface ShapeRenderDataInput {
  renderSettings: VideoSettings;
  sources: SourceImage[];
  engine: VideoEngine | string | undefined;
  inputTrackId: string;
  inputMask?: string;
  hasModelOwnedSources?: boolean;
  omitSourceVideo?: boolean;
}

export const shapeRenderDataForBackend = ({
  renderSettings,
  sources,
  engine,
  inputTrackId,
  inputMask,
  hasModelOwnedSources,
  omitSourceVideo
}: ShapeRenderDataInput): { sources: SourcesPayload } => {
  const legacy =
    typeof renderSettings.ipadapter_image_source === "string"
      ? (renderSettings.ipadapter_image_source as string)
      : undefined;
  return {
    sources: shapeSourcesForBackend({
      inputTrackId,
      inputMask,
      sources,
      engine,
      legacyIpadapterImageSource: legacy,
      hasModelOwnedSources,
      omitSourceVideo
    })
  };
};
