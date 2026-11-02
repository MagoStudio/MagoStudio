import { ControlLabel } from "@components/ControlLabel";
import { DropdownWithLabelInside } from "@components/DropdownWithLabelInside";
import { ImagesDisplay } from "@components/FileDropZone/ImagesDisplay";
import { Icon } from "@components/Icon";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { MediaTile } from "@components/MediaTile";
import { Text } from "@components/Text";
import { BulkRendersRunShotImageCardState } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunShotImageCardState";
import { BulkRendersRunShotImageTilePresentation } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunShotImageTilePresentation";
import { resolveMediaTilePresentationFromBulkRendersRunTileState } from "@domains/bulkRendersRun/utils/resolveMediaTilePresentationFromBulkRendersRunTileState";
import { ModelSchemaMap } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { useIsImagePortrait } from "@hooks/useIsImagePortrait";
import { useTranslation } from "react-i18next";

import { BulkRenderingDraftPromptField } from "../BulkRenderingDraftModal/BulkRenderingDraftPromptField";

import { BulkRenderingRunImageShotCardStatus } from "./BulkRenderingRunImageShotCardStatus";

const RENDERING_PLACEHOLDER_SIZE_CLASS_NAME = "h-[120px] w-[120px]";

const TILE_STATUS_LABEL_KEY_BY_FAILURE_PRESENTATION: Partial<
  Record<BulkRendersRunShotImageTilePresentation, string>
> = {
  qualityFailure:
    "bulk_rendering.run_view_image_card_quality_failure_tile.label",
  infrastructureFailure:
    "bulk_rendering.run_view_image_card_infrastructure_failure_tile.label"
};

export function BulkRenderingRunImageShotCard({
  shotId,
  shotName,
  cardState,
  completedStepCount,
  totalStepCount,
  tilePresentation,
  resultImageUrl,
  prompt,
  model,
  referenceAssetIds
}: {
  shotId: string;
  shotName: string;
  cardState: BulkRendersRunShotImageCardState;
  completedStepCount: number;
  totalStepCount: number;
  tilePresentation: BulkRendersRunShotImageTilePresentation;
  resultImageUrl: string | undefined;
  prompt: string | undefined;
  model: string | undefined;
  referenceAssetIds: string[];
}) {
  const { t } = useTranslation();

  const isImagePortrait = useIsImagePortrait(resultImageUrl);

  const tileFailureStatusLabelKey =
    TILE_STATUS_LABEL_KEY_BY_FAILURE_PRESENTATION[tilePresentation];

  const modelLabel = model
    ? (ModelSchemaMap[model as keyof typeof ModelSchemaMap]?.label ?? model)
    : undefined;

  return (
    <div
      data-testid={`bulk-rendering-run-image-shot-card-${shotId}`}
      data-card-state={cardState}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex h-6 items-center justify-between gap-2">
        <Text component="span" variant="sm" color="glyph-secondary">
          {shotName}
        </Text>
        <BulkRenderingRunImageShotCardStatus
          cardState={cardState}
          completedStepCount={completedStepCount}
          totalStepCount={totalStepCount}
        />
      </div>
      <div className="flex w-full items-stretch gap-3">
        <MediaTile
          testId="bulk-rendering-run-image-shot-card-tile"
          className="h-[400px] w-[282px] shrink-0"
          thumbnailUrl={resultImageUrl}
          thumbnailScaleMode={isImagePortrait ? "fill" : "fit"}
          tilePresentation={resolveMediaTilePresentationFromBulkRendersRunTileState(
            tilePresentation
          )}
          centeredContent={
            tilePresentation === "rendering" ? (
              <img
                src="/flower.gif"
                alt=""
                className={RENDERING_PLACEHOLDER_SIZE_CLASS_NAME}
              />
            ) : tileFailureStatusLabelKey ? (
              <div className="flex flex-col items-center gap-2">
                <Icon
                  iconSet="24"
                  iconName="warning"
                  className="text-glyph-error"
                />
                <Text component="span" variant="2xs" color="glyph-error">
                  {t(tileFailureStatusLabelKey)}
                </Text>
              </div>
            ) : undefined
          }
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <BulkRenderingDraftPromptField
            shotName={shotName}
            value={prompt ?? ""}
            onChange={() => {}}
            minHeightClassName="min-h-[181px]"
            disabled
          />
          <DropdownWithLabelInside
            className="h-8 w-full"
            label={t("bulk_rendering.draft_shot_card_model_label.label")}
            items={
              model && modelLabel ? [{ key: model, label: modelLabel }] : []
            }
            selectedKey={model}
            isDisabled
            onSelectionChange={() => {}}
          />
          {referenceAssetIds.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <ControlLabel
                  labelColor="glyph-tertiary"
                  label={t(
                    "bulk_rendering.draft_shot_card_image_reference_label.label"
                  )}
                />
                <InfoTooltipIcon
                  tooltip={t(
                    "img2imgForms.common.image_style_reference.tooltip"
                  )}
                  labelColor="glyph-tertiary"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <ImagesDisplay assetIds={referenceAssetIds} isReadOnly />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
