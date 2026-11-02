import { SheetGroup, ShotTags } from "@schemas/scriptProject";

import {
  SHOT_TAG_CATEGORY_ORDER,
  ShotReferenceChip
} from "./buildShotReferenceChips";

const NO_IMAGE_REASON = "no image";

export const buildDraftShotReferenceChips = (
  tags: ShotTags,
  groups: SheetGroup[]
): ShotReferenceChip[] =>
  SHOT_TAG_CATEGORY_ORDER.flatMap((category) =>
    tags[category].map((token) => {
      const group = groups.find((candidate) => candidate.token === token);
      const image =
        group?.images.find(
          (candidate) => candidate.asset_id === group.effective_asset_id
        ) ?? group?.images[0];
      const assetId = image?.asset_id ?? null;

      return {
        token,
        name: group?.name ?? token,
        category,
        kind: group?.kind ?? null,
        assetId,
        versionName: image?.name ?? null,
        thumbnailUrl: image?.thumbnail_url ?? image?.url ?? null,
        missingReason: assetId ? null : NO_IMAGE_REASON
      };
    })
  );
