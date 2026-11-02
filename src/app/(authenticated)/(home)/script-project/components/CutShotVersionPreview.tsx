import { Badge } from "@components/Badge";
import { useViewedShotVersionIds } from "@domains/scriptProject/useViewedShotVersionIds";
import { buildCutDownloadName } from "@domains/scriptProject/utils/buildCutDownloadNames";
import { hasCutShotVersionRenderFailed } from "@domains/scriptProject/utils/hasCutShotVersionRenderFailed";
import { isCutShotVersionRendering } from "@domains/scriptProject/utils/isCutShotVersionRendering";
import { CutShotVersionsInDisplayOrder } from "@domains/scriptProject/utils/orderCutShotVersionsForDisplay";
import { ProjectOutputSize } from "@domains/scriptProject/utils/projectOutputSize";
import { CutShot } from "@schemas/scriptProject";
import { useTranslation } from "react-i18next";

import { CutShotVersionRenderError } from "./CutShotVersionRenderError";
import { CutShotVersionRenderSettingsNote } from "./CutShotVersionRenderSettingsNote";
import { RenderMetricsBadge } from "./RenderMetricsBadge";
import { ShotVersionDownloadButton } from "./ShotVersionDownloadButton";
import { ShotVideoPreview } from "./ShotVideoPreview";

type Props = {
  projectId?: string;
  shot: CutShot;
  outputSize: ProjectOutputSize;
  versionsInDisplayOrder: CutShotVersionsInDisplayOrder;
  onOpenVersions?: () => void;
};

export const CutShotVersionPreview: React.FC<Props> = ({
  projectId,
  shot,
  outputSize,
  versionsInDisplayOrder,
  onOpenVersions
}) => {
  const { t } = useTranslation();
  const { markVersionsViewed } = useViewedShotVersionIds(projectId ?? "");
  const { shownVersion, pinnedVersionAssetId } = versionsInDisplayOrder;

  if (!shownVersion) return null;

  return (
    <ShotVideoPreview
      assetId={shownVersion.asset_id}
      videoUrl={shownVersion.url}
      posterUrl={shownVersion.poster_url}
      hasRender
      isRendering={isCutShotVersionRendering(shownVersion)}
      hasRenderFailed={hasCutShotVersionRenderFailed(shownVersion)}
      renderFailedContent={
        <CutShotVersionRenderError
          shotTimelineId={shot.timeline_id}
          version={shownVersion}
        />
      }
      outputSize={outputSize}
      testId={`cut-version-video-${shownVersion.asset_id}`}
      onPressVideoArea={onOpenVersions}
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
              hasRenderFinished={shownVersion.ready}
            />
            <div className="absolute right-1 top-1 flex items-center gap-1">
              {pinnedVersionAssetId === shownVersion.asset_id && (
                <Badge className="pointer-events-none bg-element-additional-active">
                  {t("script_project.pinned_badge.label")}
                </Badge>
              )}
              <ShotVersionDownloadButton
                videoUrl={shownVersion.url}
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
  );
};
