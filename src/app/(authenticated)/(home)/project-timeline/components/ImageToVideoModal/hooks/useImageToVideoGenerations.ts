import { useGetCurrentShotTrackIds } from "@domains/track/useGetCurrentShotTrackIds";
import { useGetTracksById } from "@domains/track/useGetTracksById";
import { Layer } from "@schemas/layer";

export const useImageToVideoGenerations = ({
  selectedProjectId,
  containerShotId
}: {
  selectedProjectId: string | undefined;
  containerShotId: string | undefined;
}) => {
  const { data: trackIds } = useGetCurrentShotTrackIds({
    selectedProjectId,
    selectedShotId: containerShotId
  });

  const { data: tracks } = useGetTracksById({
    trackIds: trackIds || [],
    selectedProjectId,
    selectedShotId: containerShotId
  });

  const generations: Layer[] = [...tracks].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { generations };
};
