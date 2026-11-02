import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useResolvedQueueStatus } from "@domains/queue/useResolvedQueueStatus";
import { useGetTrackById } from "@domains/track/useGetTrackById";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { resolveTrackRenderErrorMessage } from "@domains/track/utils/resolveTrackRenderErrorMessage";
import { ErrorTrackStatus } from "@home/components/status/ErrorTrackStatus";
import { CutShotVersion } from "@schemas/scriptProject";

type Props = {
  shotTimelineId: string;
  version: CutShotVersion;
};

export const CutShotVersionRenderError: React.FC<Props> = ({
  shotTimelineId,
  version
}) => {
  const selectedProjectId = useSelectedProjectId();
  const { data: track } = useGetTrackById({
    trackId: version.layer_id,
    selectedProjectId,
    selectedShotId: shotTimelineId
  });
  const { queueItem } = useResolvedQueueStatus({
    trackId: version.layer_id,
    assetStatus: undefined,
    shotIdOverride: shotTimelineId
  });

  return (
    <ErrorTrackStatus
      queueItem={queueItem ?? undefined}
      errorMessage={resolveTrackRenderErrorMessage({
        assetError: getTrackAssetData(track)?.error,
        queueItem: queueItem ?? undefined
      })}
    />
  );
};
