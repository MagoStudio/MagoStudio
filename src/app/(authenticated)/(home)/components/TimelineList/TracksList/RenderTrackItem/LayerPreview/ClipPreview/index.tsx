import { AssetDownloadIndicator } from "@components/AssetDownloadIndicator";
import { useResolvedQueueStatus } from "@domains/queue/useResolvedQueueStatus";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { useMediaBunnyFilmstrip } from "@hooks/preview/useMediaBunnyFilmstrip";
import { AssetStatus } from "@schemas/asset";
import { Clip } from "@schemas/clip";
import { getClipPositionAndSize, cn } from "@utils";
import React from "react";
import { useIntersectionObserver } from "usehooks-ts";

import { ClipSkeleton } from "../ClipSkeleton";

type Props = {
  clip: Clip;
  timelineOffset: number;
  isUploadedVideoInputTrack: boolean;
  isRender: boolean;
  selected: boolean;
  trackId: string;
};

export const ClipPreview: React.FC<Props> = React.memo(
  ({
    clip,
    timelineOffset,
    isUploadedVideoInputTrack,
    isRender,
    selected,
    trackId
  }) => {
    const shotMaxFrames = useShotMaxFrames();

    const { status: resolvedStatus } = useResolvedQueueStatus({
      trackId,
      assetStatus: clip.asset.data?.queue_status
    });

    const status = isRender ? resolvedStatus : clip.asset.data?.queue_status;

    const trackClipOffset = timelineOffset;
    const trackClipDuration = clip.asset.data?.duration || 0;

    const { ref, isIntersecting: rawIsIntersecting } = useIntersectionObserver({
      rootMargin: "100px"
    });

    const isIntersecting = rawIsIntersecting;

    const { clipWidth, clipOffset } = getClipPositionAndSize(
      trackClipOffset,
      trackClipDuration,
      shotMaxFrames
    );

    const TRACK_BORDER_WIDTH = 20;
    const filmstripWidth = clipWidth - TRACK_BORDER_WIDTH;

    const { data: filmstripUrl, isLoading: isFilmstripLoading } =
      useMediaBunnyFilmstrip({
        trackId,
        assetId: clip.asset_id,
        fps: clip.asset.data?.fps,
        width: filmstripWidth,
        enabled: isIntersecting
      });

    const imagePreviewUrl = filmstripUrl;

    const shouldDisplaySkeleton =
      (status && status !== AssetStatus.FINISHED) ||
      isFilmstripLoading ||
      !imagePreviewUrl;

    const isDisabled =
      clip?.asset?.data?.queue_status === AssetStatus.PENDING &&
      !clip.asset?.id;

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden h-track-content rounded border-2 bg-code-100 select-none pointer-events-none",
          "before:content-[''] before:absolute before:z-[5] before:top-0 before:left-0 before:h-track-content",
          "after:content-[''] after:absolute after:z-[5] after:top-0 after:right-0 after:h-track-content",
          isDisabled && "opacity-50",
          selected &&
            "border-element-primary-on-pic bg-element-primary-on-pic before:bg-element-primary-on-pic after:bg-element-primary-on-pic",
          !selected &&
            "border-code-100 hover:border-code-100 before:bg-code-100 after:bg-code-100",
          isUploadedVideoInputTrack &&
            "border-code-200 bg-code-200 hover:border-code-200 before:bg-code-200 after:bg-code-200"
        )}
        style={{ marginLeft: `${clipOffset}px`, width: clipWidth }}
        data-disabled={isDisabled}
        {...(isRender && {
          "data-onboarding-id": "pf-clip-preview"
        })}
        {...(isUploadedVideoInputTrack && {
          "data-onboarding-id": "pf-source-video-clip"
        })}
        aria-label={`track ${trackId} clip preview`}
      >
        {shouldDisplaySkeleton ? (
          <ClipSkeleton isAnimated={status === AssetStatus.INPROGRESS} />
        ) : (
          <img
            id={clip.id}
            alt=""
            className="absolute left-0 h-full w-full object-cover object-left border border-element-primary rounded-sm bg-surface-primary"
            src={imagePreviewUrl}
          />
        )}
        {isIntersecting && <AssetDownloadIndicator assetId={clip.asset_id} />}
      </div>
    );
  }
);

ClipPreview.displayName = "ClipPreview";
