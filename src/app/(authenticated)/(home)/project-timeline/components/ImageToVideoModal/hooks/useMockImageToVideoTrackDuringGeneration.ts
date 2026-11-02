import { useSetTrackInCache } from "@domains/track/useSetTrackInCache";
import { VideoSettings } from "@models/video/types";
import { Layer } from "@schemas/layer";

import { buildMockImageToVideoTrackDuringGeneration } from "../utils/buildMockImageToVideoTrackDuringGeneration";

export const useMockImageToVideoTrackDuringGeneration = ({
  selectedProjectId
}: {
  selectedProjectId: string | undefined;
}) => {
  const { setTrackInCache } = useSetTrackInCache();

  const mockImageToVideoTrackDuringGeneration = ({
    track,
    frameRange,
    renderSettingsValues,
    containerShotId,
    fps
  }: {
    track: Layer;
    frameRange: [number, number];
    renderSettingsValues: VideoSettings;
    containerShotId: string;
    fps: number;
  }) => {
    const modifiedTrack = buildMockImageToVideoTrackDuringGeneration({
      track,
      frameRange,
      renderSettingsValues,
      fps
    });

    setTrackInCache({
      modifiedTrack,
      selectedProjectId,
      selectedShotId: containerShotId
    });
  };

  return { mockImageToVideoTrackDuringGeneration };
};
