import { Text } from "@components/Text";
import { hasCutShotVersionRenderFailed } from "@domains/scriptProject/utils/hasCutShotVersionRenderFailed";
import { isCutShotVersionRendering } from "@domains/scriptProject/utils/isCutShotVersionRendering";
import { ProjectOutputSize } from "@domains/scriptProject/utils/projectOutputSize";
import { CutShot } from "@schemas/scriptProject";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

import { CutShotVersionRenderError } from "./CutShotVersionRenderError";
import { RenderMetricsBadge } from "./RenderMetricsBadge";
import { ShotVideoPreview } from "./ShotVideoPreview";

type Props = {
  shot: CutShot;
  outputSize: ProjectOutputSize;
  onPin: (assetId: string | null) => void;
  isBusy: boolean;
};

export const CutShotVersionList: React.FC<Props> = ({
  shot,
  outputSize,
  onPin,
  isBusy
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-3">
      {shot.versions.map((version) => {
        const isPinned = shot.pinned_asset_id === version.asset_id;
        const isFallbackForCut =
          !shot.pinned_asset_id && shot.asset_id === version.asset_id;

        return (
          <div
            key={version.asset_id}
            data-testid={`cut-shot-version-${version.asset_id}`}
            className={cn(
              "flex w-72 flex-col gap-1.5 rounded-xl border p-1.5",
              isPinned ? "border-glyph-action-main" : "border-element-primary"
            )}
          >
            <div className="relative">
              <ShotVideoPreview
                assetId={version.asset_id}
                videoUrl={version.url}
                posterUrl={version.poster_url}
                hasRender
                isRendering={isCutShotVersionRendering(version)}
                hasRenderFailed={hasCutShotVersionRenderFailed(version)}
                renderFailedContent={
                  <CutShotVersionRenderError
                    shotTimelineId={shot.timeline_id}
                    version={version}
                  />
                }
                outputSize={outputSize}
                testId={`cut-version-video-${version.asset_id}`}
              />
              <RenderMetricsBadge
                assetId={version.asset_id}
                kind="video"
                hasRenderFinished={version.ready}
              />
            </div>

            <div className="flex min-w-0 items-center justify-between gap-2 px-0.5">
              <div className="flex min-w-0 flex-col">
                <Text
                  variant="2xs"
                  color="glyph-secondary"
                  className="truncate"
                >
                  {version.name ?? version.asset_id}
                </Text>
                {isCutShotVersionRendering(version) && (
                  <Text variant="2xs" color="glyph-tertiary">
                    {t("script_project.version_not_ready.label")}
                  </Text>
                )}
                {isFallbackForCut && (
                  <Text variant="2xs" color="glyph-tertiary">
                    {t("script_project.effective_badge.label")}
                  </Text>
                )}
              </div>

              <button
                type="button"
                disabled={!version.ready || isBusy}
                onClick={() => onPin(isPinned ? null : version.asset_id)}
                aria-pressed={isPinned}
                data-testid={`cut-version-pin-${version.asset_id}`}
                className={cn(
                  "shrink-0 rounded px-2 py-1 font-lato text-2xs transition-colors",
                  isPinned
                    ? "bg-element-additional-active text-glyph-primary-on-pic"
                    : "bg-element-primary text-glyph-secondary hover:bg-element-primary-active hover:text-glyph-primary",
                  (!version.ready || isBusy) && "cursor-default opacity-50"
                )}
              >
                {isPinned
                  ? t("script_project.unpin_button.label")
                  : t("script_project.pin_button.label")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
