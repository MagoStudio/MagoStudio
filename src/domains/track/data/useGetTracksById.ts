import { getTrackInputVideoId } from "@domains/track/utils/getTrackInputVideoId";
import { Layer } from "@schemas/layer";
import { Project } from "@schemas/project";

import { useProject } from "../../project/useProject";

export const useGetTracksById = ({
  trackIds,
  selectedProjectId,
  selectedShotId
}: {
  trackIds: string[];
  selectedProjectId?: string;
  selectedShotId?: string;
}) => {
  const select = (project: Project): Layer[] => {
    const shot = project.timelines?.find((t) => t.id === selectedShotId);
    const allTracks = shot?.layers || [];
    const filteredTracks = allTracks.filter((l) => trackIds.includes(l.id));

    return filteredTracks.map((track) => ({
      ...track,
      derivedTrackIds: allTracks
        .filter((t) => getTrackInputVideoId(t) === track.id)
        .map((t) => t.id)
    }));
  };
  const { data: tracks, ...rest } = useProject(selectedProjectId, select);

  return {
    data: tracks || [],
    ...rest
  };
};
