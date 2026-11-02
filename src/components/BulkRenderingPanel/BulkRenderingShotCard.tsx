import { Badge } from "@components/Badge";
import { Icon } from "@components/Icon";
import { InlineVideoPlayer } from "@components/InlineVideoPlayer";
import { Skeleton } from "@components/Skeleton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import { BulkRenderingShotCardRow } from "./types";

interface Props {
  shot: BulkRenderingShotCardRow;
  isVideoStep: boolean;
}

function ShotThumbOverlay({
  children,
  "data-testid": dataTestId
}: {
  children: React.ReactNode;
  "data-testid"?: string;
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-element-on-image backdrop-blur-md"
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
}

export const BulkRenderingShotCard: React.FC<Props> = ({
  shot,
  isVideoStep
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="flex w-[189px] flex-col gap-2"
      data-testid={`bulk-rendering-shot-card-${shot.shotId}`}
    >
      <div className="group relative h-[306px] w-full overflow-hidden rounded">
        {shot.state === "loading" && (
          <div
            className="size-full"
            data-testid="bulk-rendering-shot-card-loading"
          >
            <Skeleton className="size-full" />
          </div>
        )}

        {shot.state === "loaded" && isVideoStep && shot.videoUrl && (
          <InlineVideoPlayer
            videoUrl={shot.videoUrl}
            posterUrl={shot.thumbnailUrl}
            posterAlt={shot.shotName}
            objectFit="cover"
            testId="bulk-rendering-shot-video-player"
            playAriaLabel={t(
              "bulk_rendering.panel_shot_card_play_video.ariaLabel",
              { shotName: shot.shotName }
            )}
            pauseAriaLabel={t(
              "bulk_rendering.panel_shot_card_pause_video.ariaLabel",
              { shotName: shot.shotName }
            )}
          />
        )}

        {shot.state === "loaded" &&
          !(isVideoStep && shot.videoUrl) &&
          shot.thumbnailUrl && (
            <img
              src={shot.thumbnailUrl}
              alt={shot.shotName}
              className="size-full object-cover"
            />
          )}

        {isVideoStep &&
          !shot.videoUrl &&
          (shot.state === "loading" || shot.state === "loaded") && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon
                iconSet="24-filled"
                iconName="play-forward"
                className="text-glyph-primary-on-pic"
              />
            </div>
          )}

        {shot.state === "failedQualityTest" && (
          <ShotThumbOverlay>
            <div className="flex flex-col items-center gap-2 px-2 text-center">
              <Icon
                iconSet="24"
                iconName="warning"
                className="text-glyph-error"
              />
              <Text variant="2xs" color="glyph-error" className="leading-4">
                {t("bulk_rendering.panel_shot_card_failed_quality_test.label")}
              </Text>
            </div>
          </ShotThumbOverlay>
        )}

        {shot.state === "unknownError" && (
          <>
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-1 p-2">
              <Text variant="sm" color="glyph-secondary" className="truncate">
                {shot.shotName}
              </Text>
              <div className="flex shrink-0 items-center gap-1">
                <Badge glyphColor="glyph-error">
                  {t("bulk_rendering.panel_row_status_error.label")}
                </Badge>
                <span
                  role="img"
                  aria-label={t(
                    "bulk_rendering.panel_shot_card_unknown_error_info.ariaLabel"
                  )}
                >
                  <Icon
                    iconSet="16"
                    iconName="info"
                    className="text-glyph-secondary"
                  />
                </span>
              </div>
            </div>
            <ShotThumbOverlay>
              <div className="flex flex-col items-center gap-2 px-2 text-center">
                <Icon
                  iconSet="24"
                  iconName="warning"
                  className="text-glyph-error"
                />
                <Text
                  variant="2xs"
                  color="glyph-error"
                  className="leading-4"
                  data-testid="bulk-rendering-shot-card-unknown-error-overlay-label"
                >
                  {t("bulk_rendering.panel_shot_card_unknown_error.label")}
                </Text>
                <Text variant="2xs" color="glyph-error" className="leading-4">
                  {t(
                    "bulk_rendering.panel_shot_card_unknown_error_description.label"
                  )}
                </Text>
              </div>
            </ShotThumbOverlay>
          </>
        )}

        {shot.state === "assetUnavailable" && (
          <ShotThumbOverlay data-testid="bulk-rendering-shot-card-asset-unavailable">
            <Icon
              iconSet="24"
              iconName="broken-image"
              className="text-glyph-disabled"
            />
          </ShotThumbOverlay>
        )}
      </div>
      <Text variant="sm" color="glyph-secondary" className="truncate">
        {shot.shotName}
      </Text>
    </div>
  );
};
