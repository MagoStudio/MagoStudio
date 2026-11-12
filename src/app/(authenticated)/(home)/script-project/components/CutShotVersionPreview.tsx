import { Badge } from "@components/Badge";
import { Text } from "@components/Text";
import { useViewedShotVersionIds } from "@domains/scriptProject/useViewedShotVersionIds";
import { buildCutDownloadName } from "@domains/scriptProject/utils/buildCutDownloadNames";
import { hasCutShotVersionRenderFailed } from "@domains/scriptProject/utils/hasCutShotVersionRenderFailed";
import { isCutShotVersionShownAsRendering } from "@domains/scriptProject/utils/isCutShotVersionShownAsRendering";
import { CutShotVersionsInDisplayOrder } from "@domains/scriptProject/utils/orderCutShotVersionsForDisplay";
import { ProjectOutputSize } from "@domains/scriptProject/utils/projectOutputSize";
import { resolveCutShotVersionVideo } from "@domains/scriptProject/utils/resolveCutShotVersionVideo";
import { CutShot, CutShotVersion } from "@schemas/scriptProject";
import { useTranslation } from "react-i18next";

import { CutShotVersionRenderError } from "./CutShotVersionRenderError";
import { CutShotVersionRenderSettingsNote } from "./CutShotVersionRenderSettingsNote";
import { CutShotVersionSettingsButton } from "./CutShotVersionSettingsButton";
import { RenderMetricsBadge } from "./RenderMetricsBadge";
import { ShotVersionDownloadButton } from "./ShotVersionDownloadButton";
import { ShotVideoPreview } from "./ShotVideoPreview";

type Props = {
  projectId?: string;
  shot: CutShot;
  outputSize: ProjectOutputSize;
  versionsInDisplayOrder: CutShotVersionsInDisplayOrder;
  isBusy: boolean;
  onReuseSettings: (version: CutShotVersion) => void;
};

export const CutShotVersionPreview: React.FC<Props> = ({
  projectId,
  shot,
  outputSize,
  versionsInDisplayOrder,
  isBusy,
  onReuseSettings
}) => {
  const { t } = useTranslation();
  const { markVersionsViewed } = useViewedShotVersionIds(projectId ?? "");
  const {
    shownVersion,
    displayedPinnedVersionAssetId,
    versionNumberByAssetId
  } = versionsInDisplayOrder;

  if (!shownVersion) return null;
  const shownVersionName = t("script_project.version_number.label", {
    number: versionNumberByAssetId.get(shownVersion.asset_id)
  });
  const shownVersionVideo = resolveCutShotVersionVideo(shot, shownVersion);

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-1">
        <Text
          variant="2xs"
          color="glyph-tertiary"
          className="truncate"
          data-testid={`cut-version-name-${shownVersion.asset_id}`}
        >
          {shownVersionName}
        </Text>
        <CutShotVersionSettingsButton
          className="size-4 p-0.5 [&_svg]:size-3"
          version={shownVersion}
          versionName={shownVersionName}
          isBusy={isBusy}
          onReuseSettings={onReuseSettings}
        />
      </div>
      <ShotVideoPreview
        assetId={shownVersionVideo.videoAssetId}
        videoUrl={shownVersionVideo.videoUrl}
        posterUrl={shownVersionVideo.posterUrl}
        hasRender
        isRendering={isCutShotVersionShownAsRendering(shot, shownVersion)}
        hasRenderFailed={hasCutShotVersionRenderFailed(shownVersion)}
        renderFailedContent={
          <CutShotVersionRenderError
            shotTimelineId={shot.timeline_id}
            version={shownVersion}
          />
        }
        outputSize={outputSize}
        testId={`cut-version-video-${shownVersion.asset_id}`}
        onPlay={() => {
          if (projectId) markVersionsViewed([shownVersion.asset_id]);
        }}
        overlay={
          <>
            <div
              className="pointer-events-none invisible absolute inset-0 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 *:pointer-events-auto"
              data-testid={`cut-version-hover-details-${shownVersion.asset_id}`}
            >
              <RenderMetricsBadge
                assetId={shownVersion.asset_id}
                kind="video"
                hasRenderFinished={
                  shownVersion.ready &&
                  !isCutShotVersionShownAsRendering(shot, shownVersion)
                }
              />
              <div className="absolute right-1 top-1 flex items-center gap-1">
                {displayedPinnedVersionAssetId === shownVersion.asset_id && (
                  <Badge className="pointer-events-none bg-element-additional-active">
                    {t("script_project.pinned_badge.label")}
                  </Badge>
                )}
                <ShotVersionDownloadButton
                  videoUrl={shownVersionVideo.videoUrl}
                  downloadFileName={buildCutDownloadName(shot)}
                  testId={`cut-version-download-${shownVersion.asset_id}`}
                />
              </div>
              <CutShotVersionRenderSettingsNote
                version={shownVersion}
                className="pointer-events-none absolute bottom-2 left-2 rounded bg-surface-on-image-opacity-80 px-1.5 py-0.5 backdrop-blur-md"
                testId={`cut-version-render-settings-${shownVersion.asset_id}`}
              />
            </div>
          </>
        }
      />
    </div>
  );
};
