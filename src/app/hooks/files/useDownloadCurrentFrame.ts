import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useGetTracksById } from "@domains/track/useGetTracksById";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { currentVideoFrameAtom, videoElementRefsAtom } from "@store/atoms";
import { captureFrameFromVideoElement } from "@utils/video/captureFrameFromVideoElement";
import { useAtomValue } from "jotai";
import { useState } from "react";

import { triggerBlobDownload } from "./utils";

export const useDownloadCurrentFrame = () => {
  const [isDownloadingCurrentFrame, setIsDownloadingCurrentFrame] =
    useState(false);
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const selectedTrackIds = useSelectedTrackIds();
  const currentFrame = useAtomValue(currentVideoFrameAtom);
  const videoElementRefs = useAtomValue(videoElementRefsAtom);
  const { data: tracks } = useGetTracksById({
    trackIds: selectedTrackIds,
    selectedProjectId,
    selectedShotId
  });

  const selectedTrack = tracks[0];
  const videoElement = selectedTrack
    ? videoElementRefs[selectedTrack.id]
    : undefined;

  const downloadCurrentFrame = async () => {
    if (!selectedTrack || !videoElement) return;

    try {
      setIsDownloadingCurrentFrame(true);
      const frameBlob = await captureFrameFromVideoElement({
        videoElement,
        imageFormat: "image/png"
      });
      triggerBlobDownload(
        frameBlob,
        `${selectedTrack.name}_frame_${currentFrame}.png`
      );
    } catch (error) {
      console.error("Error downloading frame:", error);
    } finally {
      setIsDownloadingCurrentFrame(false);
    }
  };

  return {
    downloadCurrentFrame,
    isDownloadingCurrentFrame,
    canDownloadCurrentFrame: !!selectedTrack && !!videoElement
  };
};
