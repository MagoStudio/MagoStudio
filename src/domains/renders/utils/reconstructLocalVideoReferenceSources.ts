import { SourceImage } from "@domains/renders/types";
import { collectLocalVideoReferenceImageIds } from "@domains/renders/utils/collectLocalVideoReferenceImageIds";
import { VideoEngine } from "@models/video/types";

import { isLocalVideoModel } from "@/platform/localVideoModels";

import { isMiniMaxH3VfxEditedFrameProvided } from "../../../../desktop/shared/minimaxH3VfxModes";

export const reconstructLocalVideoReferenceSources = (
  engine: string | undefined,
  settings: Record<string, unknown>
): SourceImage[] => {
  if (!isLocalVideoModel(engine)) return [];
  const isMiniMaxH3EditedFrameSaved =
    engine === VideoEngine.minimax_h3_local &&
    isMiniMaxH3VfxEditedFrameProvided(settings);
  if (isMiniMaxH3EditedFrameSaved)
    return [
      {
        asset_id: settings.vfx_edited_frame_id as string,
        type: "key_frame",
        ...(typeof settings.vfx_edited_frame_source_frame === "number"
          ? { index: settings.vfx_edited_frame_source_frame }
          : {})
      }
    ];
  return collectLocalVideoReferenceImageIds(engine, settings).map(
    (assetId) => ({ asset_id: assetId, type: "reference_frame" })
  );
};
