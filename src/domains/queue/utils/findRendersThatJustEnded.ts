import { QueueItem } from "@hooks/queue/interface";
import { AssetStatus } from "@schemas/asset";

const ENDED_RENDER_STATUSES = new Set<AssetStatus>([
  AssetStatus.FINISHED,
  AssetStatus.ERROR
]);

export interface RenderSnapshot {
  assetId: string;
  hasEnded: boolean;
}

export const toRenderSnapshots = (
  queueItems: QueueItem[]
): Map<string, RenderSnapshot> =>
  new Map(
    queueItems.map((queueItem) => [
      queueItem.id,
      {
        assetId: queueItem.asset_id,
        hasEnded: ENDED_RENDER_STATUSES.has(queueItem.status)
      }
    ])
  );

export const findRendersThatJustEnded = ({
  previousRenders,
  currentRenders
}: {
  previousRenders: Map<string, RenderSnapshot>;
  currentRenders: Map<string, RenderSnapshot>;
}): RenderSnapshot[] => {
  const rendersThatReachedAnEndStatus = [...currentRenders].filter(
    ([renderId, render]) =>
      render.hasEnded && previousRenders.get(renderId)?.hasEnded !== true
  );

  const rendersThatLeftTheQueueUnfinished = [...previousRenders].filter(
    ([renderId, render]) => !render.hasEnded && !currentRenders.has(renderId)
  );

  return [
    ...rendersThatReachedAnEndStatus,
    ...rendersThatLeftTheQueueUnfinished
  ].map(([, render]) => render);
};
