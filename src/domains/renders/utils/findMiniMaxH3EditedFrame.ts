import { SourceImage } from "@domains/renders/types";

export const findMiniMaxH3EditedFrame = (
  sources: SourceImage[]
): SourceImage | undefined =>
  sources.find(
    (source) => source.type === "key_frame" && source.asset_id.length > 0
  );
