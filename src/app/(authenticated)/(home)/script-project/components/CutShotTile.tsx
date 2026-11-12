import { Text } from "@components/Text";
import { formatShotTitle } from "@domains/scriptProject/utils/formatShotTitle";
import { isCutShotShownAsRendering } from "@domains/scriptProject/utils/isCutShotShownAsRendering";
import { ProjectOutputSize } from "@domains/scriptProject/utils/projectOutputSize";
import { resolveCutShotVideo } from "@domains/scriptProject/utils/resolveCutShotVideo";
import { CutShot } from "@schemas/scriptProject";
import { cn } from "@utils";
import { Button as AriaButton } from "react-aria-components/Button";
import { useTranslation } from "react-i18next";

import { ShotVideoPreview } from "./ShotVideoPreview";

type Props = {
  shot: CutShot;
  outputSize: ProjectOutputSize;
  isSelected: boolean;
  isRendering: boolean;
  onSelect: () => void;
};

export const CutShotTile: React.FC<Props> = ({
  shot,
  outputSize,
  isSelected,
  isRendering,
  onSelect
}) => {
  const { t } = useTranslation();
  const shotVideo = resolveCutShotVideo(shot);

  return (
    <AriaButton
      onPress={onSelect}
      aria-pressed={isSelected}
      data-testid={`cut-shot-${shot.sequence_id}`}
      className={cn(
        "flex w-56 flex-shrink-0 flex-col gap-1.5 rounded-xl border p-1.5 text-left outline-hidden",
        isSelected ? "border-glyph-action-main" : "border-element-primary",
        "data-[hovered]:border-glyph-secondary"
      )}
    >
      <div className="relative w-full">
        <ShotVideoPreview
          assetId={shotVideo.videoAssetId}
          videoUrl={shotVideo.videoUrl}
          posterUrl={shotVideo.posterUrl}
          hasRender={!!shot.asset_id}
          isRendering={isCutShotShownAsRendering({
            shot,
            isShotRendering: isRendering
          })}
          outputSize={outputSize}
          testId={`cut-shot-video-${shot.sequence_id}`}
        />
        {shot.is_upscale && (
          <Text
            variant="2xs"
            color="glyph-primary-on-pic"
            className="absolute right-1 top-1 rounded bg-element-additional-active px-1"
          >
            {t("script_project.upscale_badge.label")}
          </Text>
        )}
      </div>
      <div className="flex min-w-0 items-center justify-between gap-1 px-1 pb-0.5">
        <Text variant="2xs" color="glyph-secondary" className="truncate">
          {formatShotTitle({
            heading: shot.heading,
            shotIndex: shot.shot_index
          })}
          {shot.version_name ? ` · ${shot.version_name}` : ""}
        </Text>
      </div>
    </AriaButton>
  );
};
