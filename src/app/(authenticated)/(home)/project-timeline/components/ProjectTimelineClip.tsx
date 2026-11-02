"use client";

import { Text } from "@components/Text";
import { Tooltip } from "@components/Tooltip";
import { useMediaBunnyFilmstrip } from "@hooks/preview/useMediaBunnyFilmstrip";
import { useTooltip } from "@hooks/useTooltip";
import { Clip } from "@schemas/clip";
import { cn } from "@utils";
import { useState } from "react";
import { Button as AriaButton } from "react-aria-components/Button";

const MIN_FILMSTRIP_WIDTH = 100;
const FILMSTRIP_WIDTH_MULTIPLIER = 10;

interface ProjectTimelineClipProps {
  clipData: Clip | undefined;
  trackId: string | undefined;
  shotName: string;
  widthPercent: number;
  offsetPercent?: number;
  isBlank: boolean;
  onPress: () => void;
}

export function ProjectTimelineClip({
  clipData,
  trackId,
  shotName,
  widthPercent,
  offsetPercent = 0,
  isBlank,
  onPress
}: ProjectTimelineClipProps) {
  const [labelElement, setLabelElement] = useState<HTMLDivElement | null>(null);
  const { visible, showTooltip, hideTooltip } = useTooltip();

  const filmstripWidth = Math.max(
    MIN_FILMSTRIP_WIDTH,
    Math.round(widthPercent * FILMSTRIP_WIDTH_MULTIPLIER)
  );

  const { data: filmstripUrl } = useMediaBunnyFilmstrip({
    trackId: trackId ?? "",
    assetId: clipData?.asset_id ?? "",
    fps: clipData?.asset?.data?.fps,
    width: filmstripWidth,
    enabled: !isBlank && !!clipData && !!trackId
  });

  return (
    <AriaButton
      type="button"
      onPress={onPress}
      aria-label={shotName}
      className={cn(
        "relative block h-[76px] shrink-0 cursor-pointer overflow-hidden rounded border-2 border-glyph-action-main outline-hidden",
        isBlank ? "bg-surface-primary" : "bg-element-primary"
      )}
      style={{
        width: `${widthPercent}%`,
        marginLeft: offsetPercent > 0 ? `${offsetPercent}%` : undefined
      }}
      onHoverStart={isBlank ? undefined : showTooltip}
      onHoverEnd={isBlank ? undefined : hideTooltip}
      data-testid="project-timeline-clip"
    >
      {!isBlank && (
        <>
          <Tooltip
            targetElement={labelElement}
            isVisible={visible}
            textContent={shotName}
            placement="top-start"
          />
          <div className="absolute inset-0 overflow-hidden rounded">
            {filmstripUrl ? (
              <img
                alt=""
                className="absolute left-0 h-full w-full object-cover object-left"
                src={filmstripUrl}
              />
            ) : (
              <div className="h-full w-full bg-surface-primary" />
            )}
          </div>
          <div
            ref={setLabelElement}
            className="absolute bottom-1 left-1 backdrop-blur-[10px] bg-element-on-image rounded px-1.5 py-0.5"
          >
            <Text
              component="span"
              variant="xs"
              color="glyph-primary-on-pic"
              className="whitespace-nowrap"
            >
              {shotName}
            </Text>
          </div>
        </>
      )}
    </AriaButton>
  );
}
