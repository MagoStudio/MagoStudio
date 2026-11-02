import { SheetGroup, SheetKind, ShotState } from "@schemas/scriptProject";

export const SHOT_TAG_CATEGORY_ORDER = [
  "characters",
  "environments",
  "props"
] as const;

export type ShotTagCategory = (typeof SHOT_TAG_CATEGORY_ORDER)[number];

export type ShotReferenceChip = {
  token: string;
  name: string;
  category: ShotTagCategory;
  kind: SheetKind | null;
  assetId: string | null;
  versionName: string | null;
  thumbnailUrl: string | null;
  missingReason: string | null;
};

const NO_IMAGE_REASON = "no image";

export const buildShotReferenceChips = (
  shot: ShotState,
  groups: SheetGroup[]
): ShotReferenceChip[] =>
  SHOT_TAG_CATEGORY_ORDER.flatMap((category) =>
    shot.tags[category].map((token) => {
      const group = groups.find((candidate) => candidate.token === token);
      const resolvedReference = (shot.references[category] ?? []).find(
        (reference) => reference.token === token
      );
      const assetId = resolvedReference?.asset_id ?? null;
      const image = group?.images.find(
        (candidate) => candidate.asset_id === assetId
      );
      const missingReference = shot.missing_references.find(
        (missing) => missing.token === token
      );

      return {
        token,
        name: group?.name ?? token,
        category,
        kind: group?.kind ?? null,
        assetId,
        versionName: image?.name ?? null,
        thumbnailUrl: image?.thumbnail_url ?? image?.url ?? null,
        missingReason: assetId
          ? null
          : (missingReference?.reason ?? NO_IMAGE_REASON)
      };
    })
  );
