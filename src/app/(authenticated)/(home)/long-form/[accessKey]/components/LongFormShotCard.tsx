import { AssetDownloadIndicator } from "@components/AssetDownloadIndicator";
import { CircularProgress } from "@components/CircularProgress";
import { Skeleton } from "@components/Skeleton";
import { Text } from "@components/Text";
import { ShotCardState } from "@domains/longFormRun/utils/deriveShotCardState";
import { ShotFailureOutcome } from "@domains/longFormRun/utils/deriveShotFailureOutcome";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { useMountEffect } from "@hooks/useMountEffect";
import { Layer } from "@schemas/layer";
import { GlyphPalette } from "@styles/types";
import { cn } from "@utils";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useIntersectionObserver } from "usehooks-ts";

import { useLongFormShotVideoUrl } from "../hooks/useLongFormShotVideoUrl";

import { LongFormShotCardFailure } from "./LongFormShotCardFailure";
import { LongFormShotCardHeader } from "./LongFormShotCardHeader";

const CARD_WIDTH_CLASS = "w-[calc((100vh-10rem)*9/16)]";
const CARD_SIZE_CLASS = `h-[calc(100vh-10rem)] ${CARD_WIDTH_CLASS}`;

const NON_READY_STATUS_TRANSLATION_KEY: Record<
  Exclude<ShotCardState, "ready" | "failed">,
  string
> = {
  notStarted: "longForm.shotState.notStarted.label",
  rendering: "longForm.shotState.rendering.label"
};

const deriveFailedShotStatus = (
  failure: ShotFailureOutcome | undefined,
  cancelledLabel: string,
  unknownErrorLabel: string
): string => {
  if (failure?.outcome === "cancelled") return cancelledLabel;
  return failure?.message || unknownErrorLabel;
};

interface LongFormShotCardProps {
  index: number;
  label: string;
  cardState: ShotCardState;
  failure: ShotFailureOutcome | undefined;
  renderTrack: Layer | undefined;
  onVideoPlay: (video: HTMLVideoElement) => void;
}

export const LongFormShotCard: React.FC<LongFormShotCardProps> = ({
  index,
  label,
  cardState,
  failure,
  renderTrack,
  onVideoPlay
}) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const { ref: visibilityRef, isIntersecting } = useIntersectionObserver({
    rootMargin: "160px"
  });
  const isShotReadyToPreview = cardState === "ready" && !!renderTrack;
  const { videoUrl } = useLongFormShotVideoUrl(
    isShotReadyToPreview ? renderTrack : undefined,
    isIntersecting
  );

  useMountEffect(() => {
    cardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "end"
    });
  });

  const statusColor: GlyphPalette =
    cardState === "failed" ? "glyph-error" : "glyph-tertiary";
  const status =
    cardState === "ready"
      ? undefined
      : cardState === "failed"
        ? deriveFailedShotStatus(
            failure,
            t("status.cancelled.label"),
            t("status.unknown_error.label")
          )
        : t(NON_READY_STATUS_TRANSLATION_KEY[cardState]);
  const tooltipMessage = failure
    ? failure.message || t("notifications.render_generation_failed.description")
    : undefined;

  return (
    <div
      ref={(element) => {
        cardRef.current = element;
        visibilityRef(element);
      }}
      data-testid={`long-form-shot-${index}`}
      className={cn("flex shrink-0 flex-col gap-2", CARD_WIDTH_CLASS)}
    >
      <LongFormShotCardHeader
        label={label}
        status={status}
        statusColor={statusColor}
        tooltipMessage={tooltipMessage}
      />
      {isShotReadyToPreview ? (
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-lg bg-black",
            CARD_SIZE_CLASS
          )}
        >
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              playsInline
              onPlay={(event) => onVideoPlay(event.currentTarget)}
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            <CircularProgress aria-label={t("status.loading_video.label")} />
          )}
          {isIntersecting && (
            <AssetDownloadIndicator assetId={getTrackAssetId(renderTrack)} />
          )}
        </div>
      ) : cardState === "failed" ? (
        <LongFormShotCardFailure className={CARD_SIZE_CLASS} />
      ) : (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-lg bg-surface-primary p-4 text-center",
            CARD_SIZE_CLASS
          )}
        >
          {cardState === "rendering" ? (
            <Skeleton className="absolute inset-0 h-full w-full" />
          ) : (
            <Text component="span" variant="sm" color="glyph-tertiary">
              {t("longForm.shotState.notStarted.label")}
            </Text>
          )}
        </div>
      )}
    </div>
  );
};
