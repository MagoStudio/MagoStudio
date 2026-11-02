import { CircularProgress } from "@components/CircularProgress";
import { Skeleton } from "@components/Skeleton";
import { cn } from "@utils";
import { useState } from "react";

export type MediaTilePresentation = "asset" | "black" | "rendering" | "shimmer";

type Props = {
  className?: string;
  testId?: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  media?: React.ReactNode;
  isLoading?: boolean;
  tilePresentation: MediaTilePresentation;
  centeredContent?: React.ReactNode;
  centeredOverlay?: React.ReactNode;
  thumbnailScaleMode?: "fit" | "fill";
  labelPill?: React.ReactNode;
  actions?: React.ReactNode;
  hoverActions?: React.ReactNode;
  footer?: React.ReactNode;
  overlay?: React.ReactNode;
};

export const MediaTile: React.FC<Props> = ({
  className,
  testId,
  thumbnailUrl,
  thumbnailAlt,
  media,
  isLoading,
  tilePresentation,
  centeredContent,
  centeredOverlay,
  thumbnailScaleMode = "fit",
  labelPill,
  actions,
  hoverActions,
  footer,
  overlay
}) => {
  const [failedUrl, setFailedUrl] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  if (overlay) {
    return (
      <div
        data-testid={testId}
        className={cn(
          "relative flex h-[201px] w-full items-center justify-center rounded border border-dashed border-glyph-disabled px-2",
          className
        )}
      >
        {overlay}
      </div>
    );
  }

  const isTileBlank = tilePresentation === "black";
  const isTileShimmering = tilePresentation === "shimmer";
  const showsSpinnerOrCenteredContent = !isTileBlank && !isTileShimmering;

  return (
    <div
      data-testid={testId}
      className={cn(
        "group relative h-[201px] w-full overflow-hidden rounded",
        isTileBlank ? "bg-glyph-invert-main" : "bg-surface-background",
        className
      )}
    >
      {media}
      {!media && thumbnailUrl && failedUrl !== thumbnailUrl && (
        <img
          key={attempt}
          src={thumbnailUrl}
          alt={thumbnailAlt ?? ""}
          onError={() => setFailedUrl(thumbnailUrl)}
          className={cn(
            "absolute inset-0 h-full w-full",
            thumbnailScaleMode === "fill" ? "object-cover" : "object-contain"
          )}
        />
      )}
      {!media && thumbnailUrl && failedUrl === thumbnailUrl && (
        <div
          role="status"
          className="absolute inset-0 flex flex-col items-center justify-center text-sm"
        >
          <span>Media unavailable</span>
          <button
            type="button"
            className="underline"
            onClick={(event) => {
              event.stopPropagation();
              setFailedUrl(undefined);
              setAttempt((value) => value + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}
      {!thumbnailUrl && isTileShimmering && (
        <div data-testid="media-tile-shimmer" className="absolute inset-0">
          <Skeleton tone="tile" className="h-full w-full rounded-none" />
        </div>
      )}
      {!thumbnailUrl && showsSpinnerOrCenteredContent && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CircularProgress color="glyph-tertiary" size="md" />
        </div>
      )}
      {!thumbnailUrl &&
        showsSpinnerOrCenteredContent &&
        !isLoading &&
        centeredContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            {centeredContent}
          </div>
        )}
      {centeredOverlay && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {centeredOverlay}
        </div>
      )}
      {labelPill && <div className="absolute top-2 left-2">{labelPill}</div>}
      {actions && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {actions}
        </div>
      )}
      {hoverActions && (
        <div className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
          {hoverActions}
        </div>
      )}
      {footer && <div className="absolute inset-x-0 bottom-0">{footer}</div>}
    </div>
  );
};
