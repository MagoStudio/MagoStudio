import { useGetTrackById } from "@domains/track/useGetTrackById";
import { useEffect, useRef } from "react";

import { useImageToVideoQueueReentryTrackId } from "./useImageToVideoQueueReentryTrackId";
import { useImageToVideoReuseRenderSettings } from "./useImageToVideoReuseRenderSettings";

export const useImageToVideoQueueReentry = ({
  selectedProjectId,
  containerShotId
}: {
  selectedProjectId: string | undefined;
  containerShotId: string | undefined;
}) => {
  const reentryTrackId = useImageToVideoQueueReentryTrackId();
  const { data: reentryTrack } = useGetTrackById({
    trackId: reentryTrackId,
    selectedProjectId,
    selectedShotId: containerShotId
  });
  const { reuseSettings, isStartImageAssetResolved } =
    useImageToVideoReuseRenderSettings(reentryTrack);
  const hasPrefilledRef = useRef(false);

  // oxlint-disable-next-line custom-react/no-use-effect -- one-time sync of a queue-reopened render's settings into the form atoms once the track data and its start-image asset resolve
  useEffect(() => {
    if (hasPrefilledRef.current) return;
    if (!reentryTrackId || !reentryTrack) return;
    if (!isStartImageAssetResolved) return;

    hasPrefilledRef.current = true;
    reuseSettings();
  }, [reentryTrackId, reentryTrack, isStartImageAssetResolved, reuseSettings]);

  return { reentryTrackId };
};
