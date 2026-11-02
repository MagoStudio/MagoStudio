import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useGetTrackById } from "@domains/track/useGetTrackById";
import { useSourceVideoTrackId } from "@domains/track/useSourceVideoTrackId";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";

export const useSourceVideoAssetId = (): string | undefined => {
  const sourceVideoTrackId = useSourceVideoTrackId();
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();

  const { data: sourceTrack } = useGetTrackById({
    trackId: sourceVideoTrackId,
    selectedProjectId,
    selectedShotId
  });

  return getTrackAssetId(sourceTrack);
};
