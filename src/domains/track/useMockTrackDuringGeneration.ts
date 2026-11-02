import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { VideoSettings } from "@models/video/types";
import { Layer } from "@schemas/layer";

import { useSetTrackInCache } from "./data/useSetTrackInCache";
import { buildMockTrackDuringGeneration } from "./utils/buildMockTrackDuringGeneration";

export const useMockTrackDuringGeneration = () => {
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();

  const { setTrackInCache } = useSetTrackInCache();

  const mockTrackDuringGeneration = ({
    track,
    frameRange,
    renderSettingsValues,
    inputTrackId,
    fps
  }: {
    track: Layer;
    frameRange: [number, number];
    renderSettingsValues: VideoSettings;
    inputTrackId: string;
    fps: number;
  }) => {
    const modifiedTrack = buildMockTrackDuringGeneration({
      track,
      frameRange,
      renderSettingsValues,
      inputTrackId,
      fps
    });

    setTrackInCache({
      modifiedTrack,
      selectedProjectId,
      selectedShotId
    });
  };

  const resetTrackDuringGeneration = (track: Layer) => {
    const modifiedTrack: Layer = {
      ...track,
      data: {
        ...track.data,
        skeletonFrameRange: undefined
      }
    };

    setTrackInCache({
      modifiedTrack,
      selectedProjectId,
      selectedShotId
    });
  };

  return {
    mockTrackDuringGeneration,
    resetTrackDuringGeneration
  };
};
