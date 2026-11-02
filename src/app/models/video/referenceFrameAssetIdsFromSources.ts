import { SourceImage } from "@domains/renders/types";

export const referenceFrameAssetIdsFromSources = (
  sources: SourceImage[]
): string[] =>
  sources
    .filter(
      (source) =>
        source.type === "reference_frame" && source.asset_id.length > 0
    )
    .map((source) => source.asset_id);
