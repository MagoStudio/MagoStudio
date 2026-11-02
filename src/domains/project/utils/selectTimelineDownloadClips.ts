import { TimelineShotEntry } from "@domains/project/useProjectTimelineData";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { isTrackAssetFinished } from "@domains/track/utils/isTrackAssetFinished";
import { Layer, LayerType } from "@schemas/layer";

export interface TimelineDownloadClip {
  shotId: string;
  shotName: string;
  layerId: string;
  assetId: string | undefined;
  isPinnedRender: boolean;
}

const getPinnedRenderLayer = (
  entry: TimelineShotEntry,
  pinnedTrackIds: Record<string, string>
): Layer | undefined => {
  const pinnedLayerId = pinnedTrackIds[entry.shot.id];
  if (!pinnedLayerId) return undefined;
  const layer = entry.shot.layers.find(
    (l) => l.id === pinnedLayerId && l.type === LayerType.RENDER
  );
  return layer && isTrackAssetFinished(layer) ? layer : undefined;
};

const toClip = (
  entry: TimelineShotEntry,
  layer: Layer,
  isPinnedRender: boolean
): TimelineDownloadClip => ({
  shotId: entry.shot.id,
  shotName: entry.shot.name,
  layerId: layer.id,
  assetId: getTrackAssetId(layer),
  isPinnedRender
});

export const selectPinnedClips = (
  shots: TimelineShotEntry[],
  pinnedTrackIds: Record<string, string>
): TimelineDownloadClip[] =>
  shots.flatMap((entry) => {
    const pinned = getPinnedRenderLayer(entry, pinnedTrackIds);
    return pinned ? [toClip(entry, pinned, true)] : [];
  });
