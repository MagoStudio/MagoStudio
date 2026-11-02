import { useResolvedQueueStatus } from "@domains/queue/useResolvedQueueStatus";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { useChangeSelectedTracks } from "@domains/track/useChangeSelectedTracks";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { getTimelineOffset } from "@domains/track/utils/frameCoordinates";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { Layer, LayerType } from "@schemas/layer";
import {
  currentVideoFrameAtom,
  isPlayingAtom,
  useInputTrackIdAtom
} from "@store/atoms";
import { getClipPositionAndSize, cn } from "@utils";
import { useAtomValue, useSetAtom } from "jotai";
import { memo } from "react";

import { SelectedRangeBox } from "../TrackDetails/SelectedRangeBox";

import { ClipPreview } from "./ClipPreview";
import { ClipSkeleton } from "./ClipSkeleton";

interface Props {
  track: Layer;
}

export const LayerPreview: React.FC<Props> = memo(({ track }) => {
  const { onSelectedTracksChange } = useChangeSelectedTracks();
  const selectedTrackIds = useSelectedTrackIds();
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const setCurrentVideoFrame = useSetAtom(currentVideoFrameAtom);
  const inputTrackIdAtom = useInputTrackIdAtom();
  const inputTrackId = useAtomValue(inputTrackIdAtom);
  const isInputTrack = track.id === inputTrackId;

  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();

  const isUploadedVideoInputTrack = videoTrack.id === track.id;

  const isRender = track.type.toLowerCase() === LayerType.RENDER.toLowerCase();

  const isTrackSelected = selectedTrackIds.includes(track.id);

  const { status: layerRenderStatus } = useResolvedQueueStatus({
    trackId: track.id,
    assetStatus: getTrackAssetData(track)?.queue_status
  });

  const handleClick = (e: React.MouseEvent) => {
    onSelectedTracksChange({
      clickedTrack: track,
      renderStatus: layerRenderStatus,
      isMultiSelect: e.metaKey || e.ctrlKey,
      setIsPlaying
    });
  };

  const clip = getTrackClip(track);
  const frameStart = getTimelineOffset(track);

  const handleDoubleClick = () => {
    if (track.clips.length > 0) {
      setCurrentVideoFrame(frameStart);
      setIsPlaying(false);
      trackingUtils.trackActions.doubleClick(track.id);
    }
  };

  const shotMaxFrames = useShotMaxFrames();
  const trackSkeletonFrameRange = track.data.skeletonFrameRange;

  const skeletonPosition = trackSkeletonFrameRange
    ? getClipPositionAndSize(
        trackSkeletonFrameRange[0],
        trackSkeletonFrameRange[1] - trackSkeletonFrameRange[0],
        shotMaxFrames
      )
    : null;

  const shouldShowClipPreview =
    !trackSkeletonFrameRange &&
    (isUploadedVideoInputTrack || isRender) &&
    !!clip;

  const shouldShowEmptyPlaceholder =
    !trackSkeletonFrameRange &&
    (!(isUploadedVideoInputTrack || isRender) || !clip);

  return (
    <div
      aria-label={`timeline track ${track.name} ${isTrackSelected ? "selected" : "not selected"}`}
      className="relative flex flex-col items-center w-timeline-container pl-3"
    >
      <div
        className={cn(
          "-ml-2 relative overflow-visible flex flex-col h-track w-full gap-2 border-y-2 border-y-element-primary bg-element-primary",
          isTrackSelected &&
            "border-y-glyph-action-main bg-glyph-action-main-opacity-30 overflow-visible"
        )}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {isInputTrack && <SelectedRangeBox />}

        {skeletonPosition && (
          <div
            className="relative overflow-hidden h-track-content rounded border-2 border-code-100 bg-code-100 select-none pointer-events-none"
            style={{
              marginLeft: `${skeletonPosition.clipOffset}px`,
              width: skeletonPosition.clipWidth
            }}
          >
            <ClipSkeleton isAnimated />
          </div>
        )}

        {!trackSkeletonFrameRange && shouldShowClipPreview && (
          <ClipPreview
            clip={clip}
            timelineOffset={frameStart}
            isRender={isRender}
            isUploadedVideoInputTrack={isUploadedVideoInputTrack}
            selected={isTrackSelected}
            trackId={track.id}
          />
        )}

        {shouldShowEmptyPlaceholder && <div className="h-16" />}
      </div>
    </div>
  );
});

LayerPreview.displayName = "LayerPreview";
