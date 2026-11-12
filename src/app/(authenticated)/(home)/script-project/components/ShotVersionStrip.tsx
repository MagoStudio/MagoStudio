import { Badge } from "@components/Badge";
import { GhostButton } from "@components/GhostButton";
import { Text } from "@components/Text";
import { formatPlanTimestamp } from "@domains/plan/utils/formatPlanTimestamp";
import { useProject } from "@domains/project/useProject";
import { useShotVersionReview } from "@domains/scriptProject/useShotVersionReview";
import { buildCutDownloadName } from "@domains/scriptProject/utils/buildCutDownloadNames";
import { hasCutShotVersionRenderFailed } from "@domains/scriptProject/utils/hasCutShotVersionRenderFailed";
import { isCutShotVersionNew } from "@domains/scriptProject/utils/isCutShotVersionNew";
import { isCutShotVersionShownAsRendering } from "@domains/scriptProject/utils/isCutShotVersionShownAsRendering";
import { CutShotVersionsInDisplayOrder } from "@domains/scriptProject/utils/orderCutShotVersionsForDisplay";
import { ProjectOutputSize } from "@domains/scriptProject/utils/projectOutputSize";
import { resolveCutShotVersionVideo } from "@domains/scriptProject/utils/resolveCutShotVersionVideo";
import { CutShot, CutShotVersion } from "@schemas/scriptProject";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

import { CutShotVersionRenderError } from "./CutShotVersionRenderError";
import { CutShotVersionRenderSettingsNote } from "./CutShotVersionRenderSettingsNote";
import { RenderMetricsBadge } from "./RenderMetricsBadge";
import { ShotVersionDownloadButton } from "./ShotVersionDownloadButton";
import { ShotVersionMoreMenu } from "./ShotVersionMoreMenu";
import { ShotVideoPreview } from "./ShotVideoPreview";

const hoverOnlyClassName =
  "invisible opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 group-data-[video-playing]:invisible";

type Props = {
  projectId: string;
  shot: CutShot;
  outputSize: ProjectOutputSize;
  versionsInDisplayOrder: CutShotVersionsInDisplayOrder;
  isBusy: boolean;
  onPin: (assetId: string | null) => void;
  onReuseSettings: (version: CutShotVersion) => void;
  visibleVersionCount?: number;
  onOpenVersions?: () => void;
};

export const ShotVersionStrip: React.FC<Props> = ({
  projectId,
  shot,
  outputSize,
  versionsInDisplayOrder,
  isBusy,
  onPin,
  onReuseSettings,
  visibleVersionCount,
  onOpenVersions
}) => {
  const { t } = useTranslation();
  const [outputWidthPx, outputHeightPx] = outputSize;
  const isPortraitOutput = outputHeightPx > outputWidthPx;
  const { data: project } = useProject(projectId);
  const { viewedVersionIds, markVersionsViewed } =
    useShotVersionReview(projectId);
  const {
    versionsNewestFirst,
    displayedPinnedVersionAssetId,
    versionNumberByAssetId
  } = versionsInDisplayOrder;
  const visibleVersions = versionsNewestFirst.filter(
    (version, index) =>
      visibleVersionCount === undefined ||
      index < visibleVersionCount ||
      version.asset_id === shot.pinned_asset_id
  );
  if (!visibleVersions.length) return null;
  return (
    <div className="contents">
      {visibleVersions.map((version) => {
        const pinned = displayedPinnedVersionAssetId === version.asset_id;
        const isVersionShownAsRendering = isCutShotVersionShownAsRendering(
          shot,
          version
        );
        const isNew =
          !isVersionShownAsRendering &&
          isCutShotVersionNew(version, viewedVersionIds);
        // Current cut responses omit timestamps; project layers already expose creation time.
        const layer = project?.timelines
          ?.flatMap((timeline) => timeline.layers)
          .find((item) => item.id === version.layer_id);
        const versionLabel = t("script_project.version_number.label", {
          number: versionNumberByAssetId.get(version.asset_id)
        });
        const renderedAt = formatPlanTimestamp(
          version.created_at ?? layer?.created_at.toISOString()
        );
        const versionVideo = resolveCutShotVersionVideo(shot, version);
        return (
          <div
            key={version.asset_id}
            className="flex w-full min-w-0 shrink-0 flex-col gap-1"
            data-testid={`shot-card-version-${version.asset_id}`}
          >
            <div className="flex min-w-0 items-center gap-1">
              <Text
                variant="2xs"
                color="glyph-tertiary"
                className="truncate"
                data-testid={`shot-card-version-name-${version.asset_id}`}
              >
                {versionLabel}
              </Text>
              {pinned && (
                <Badge
                  glyphColor="glyph-primary"
                  className="h-auto min-w-0 bg-element-primary px-1 text-2xs"
                  data-testid={`shot-card-version-pinned-${version.asset_id}`}
                >
                  {t("script_project.pinned_badge.label")}
                </Badge>
              )}
            </div>
            <ShotVideoPreview
              assetId={versionVideo.videoAssetId}
              videoUrl={versionVideo.videoUrl}
              posterUrl={versionVideo.posterUrl}
              hasRender
              isRendering={isVersionShownAsRendering}
              hasRenderFailed={hasCutShotVersionRenderFailed(version)}
              renderFailedContent={
                <CutShotVersionRenderError
                  shotTimelineId={shot.timeline_id}
                  version={version}
                />
              }
              outputSize={outputSize}
              testId={`shot-card-version-video-${version.asset_id}`}
              onPressVideoArea={onOpenVersions}
              onPlay={() => markVersionsViewed([version.asset_id])}
              overlay={
                <>
                  <div
                    className="absolute left-1 top-1 z-10 flex items-center gap-1"
                    data-testid={`shot-card-version-rating-${version.asset_id}`}
                  >
                    <RenderMetricsBadge
                      assetId={version.asset_id}
                      kind="video"
                      hasRenderFinished={
                        version.ready && !isVersionShownAsRendering
                      }
                      className="static h-auto gap-1 px-1 py-0 text-2xs"
                    />
                    {isNew && (
                      <Text
                        variant="2xs"
                        className="pointer-events-none rounded bg-element-warning px-1"
                        color="glyph-invert-main"
                        data-testid={`shot-card-version-new-${version.asset_id}`}
                      >
                        {t("script_project.version_new_badge.label")}
                      </Text>
                    )}
                  </div>
                  <div
                    className={cn(
                      "absolute right-1 top-1 z-10 flex gap-1",
                      isPortraitOutput ? "flex-col items-end" : "items-center"
                    )}
                  >
                    <div
                      className={cn(
                        "flex gap-1",
                        isPortraitOutput ? "flex-col" : "items-center",
                        hoverOnlyClassName
                      )}
                      data-testid={`shot-card-version-actions-${version.asset_id}`}
                    >
                      <ShotVersionDownloadButton
                        videoUrl={versionVideo.videoUrl}
                        downloadFileName={buildCutDownloadName(shot)}
                        testId={`shot-card-version-download-${version.asset_id}`}
                      />
                      <ShotVersionMoreMenu
                        versionName={versionLabel}
                        renderedAt={renderedAt}
                        isReuseSettingsDisabled={
                          isBusy ||
                          (!version.render_spec && !version.input_settings)
                        }
                        onReuseSettings={() => onReuseSettings(version)}
                        testId={`shot-card-version-more-${version.asset_id}`}
                      />
                    </div>
                  </div>
                  <div
                    className={cn(
                      "absolute inset-x-1 bottom-1 z-10 flex gap-1",
                      isPortraitOutput
                        ? "flex-col items-start"
                        : "items-end justify-between",
                      hoverOnlyClassName
                    )}
                    data-testid={`shot-card-version-info-${version.asset_id}`}
                  >
                    <CutShotVersionRenderSettingsNote
                      version={version}
                      className="pointer-events-none min-w-0 max-w-full truncate rounded bg-surface-on-image-opacity-80 px-1.5 py-0.5 backdrop-blur-md"
                      testId={`shot-card-version-render-settings-${version.asset_id}`}
                    />
                    <GhostButton
                      colorScheme="white"
                      className={
                        isPortraitOutput ? "w-full" : "ml-auto shrink-0"
                      }
                      isDisabled={
                        isBusy || !version.ready || isVersionShownAsRendering
                      }
                      onPress={() => {
                        if (!pinned) markVersionsViewed([version.asset_id]);
                        onPin(pinned ? null : version.asset_id);
                      }}
                      data-testid={`shot-card-version-pin-${version.asset_id}`}
                    >
                      {t(
                        pinned
                          ? "script_project.unpin_shot_version_button.label"
                          : "script_project.pin_button.label"
                      )}
                    </GhostButton>
                  </div>
                </>
              }
            />
          </div>
        );
      })}
    </div>
  );
};
