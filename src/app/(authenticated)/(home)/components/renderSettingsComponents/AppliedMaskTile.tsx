import { Badge } from "@components/Badge";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { MediaTile } from "@components/MediaTile";
import { Tooltip } from "@components/Tooltip";
import { useVideoFrame } from "@domains/asset/useVideoFrame";
import { useAdjustedFrameRange } from "@domains/renders/useAdjustedFrameRange";
import { useMaskRangeValidation } from "@domains/renders/useMaskRangeValidation";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "./interface";

const TILE_TEST_ID = "applied-mask-tile";

export const AppliedMaskTile: React.FC<
  RenderSettingComponentProps<string | undefined>
> = ({ value, isDisabled }) => {
  const { t } = useTranslation();
  const {
    renderSettingsValuesAtom,
    selectedModelAtom,
    clearMaskAsInpaintingInputAtom
  } = useRenderSettingsAtoms();
  const renderSettings = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const adjustedFrameRange = useAdjustedFrameRange();
  const clearMask = useSetAtom(clearMaskAsInpaintingInputAtom);

  const maskTrackId = typeof value === "string" ? value : undefined;
  const { data } = useFilteredAndSortedTracks();
  const maskTrack = maskTrackId
    ? data.tracks.find((track) => track.id === maskTrackId)
    : undefined;
  const maskAssetId = getTrackAssetId(maskTrack);
  const { data: maskFrame, isLoading: isMaskLoading } = useVideoFrame({
    assetId: maskAssetId,
    enabled: !!maskAssetId,
    frameNumber: 0,
    fps: getTrackAssetData(maskTrack)?.fps
  });

  const maskRangeError = useMaskRangeValidation({
    selectedModelName: selectedModel.name,
    renderSettingsValues: renderSettings,
    rangeFrames: adjustedFrameRange
  });
  const hasRangeError = !!maskRangeError;
  const errorPillPrefix = maskRangeError
    ? t("inpainting.mask_range_error.pill_short.prefix")
    : undefined;
  const errorPillRange = maskRangeError
    ? t("inpainting.mask_range_error.pill_short.range", {
        from: maskRangeError.maskFrames[0],
        to: maskRangeError.maskFrames[1]
      })
    : undefined;
  const errorTooltipText = maskRangeError
    ? t(`inpainting.mask_range_error.${maskRangeError.kind}.description`)
    : undefined;

  const handleDeleteMask = () => {
    clearMask();
  };

  const trackNamePill = maskTrack?.name ? (
    <Badge className="!min-w-0 !shrink truncate">{maskTrack.name}</Badge>
  ) : undefined;

  const rangeErrorPill =
    hasRangeError && errorPillPrefix && errorPillRange ? (
      <div
        className="flex items-center gap-1 rounded bg-element-on-image px-1.5 py-0.5 text-[10px] leading-4 font-medium whitespace-nowrap"
        data-testid={`${TILE_TEST_ID}-error-pill`}
      >
        <span className="text-glyph-error">{errorPillPrefix}</span>
        {errorTooltipText ? (
          <Tooltip
            placement="top"
            textContent={errorTooltipText}
            className="bg-element-error text-glyph-primary-on-pic shadow-none"
            arrowClassName="fill-element-error"
            trigger={
              <span
                className="flex items-center text-glyph-error"
                data-testid={`${TILE_TEST_ID}-error-tooltip-trigger`}
              >
                <Icon iconSet="16-filled" iconName="info" className="h-3 w-3" />
              </span>
            }
          />
        ) : (
          <Icon
            iconSet="16-filled"
            iconName="info"
            className="h-3 w-3 text-glyph-error"
          />
        )}
        <span className="text-glyph-error">{errorPillRange}</span>
      </div>
    ) : undefined;

  return (
    <MediaTile
      testId={TILE_TEST_ID}
      className={hasRangeError ? "border border-element-error" : undefined}
      thumbnailUrl={maskFrame}
      isLoading={isMaskLoading}
      tilePresentation="asset"
      labelPill={
        trackNamePill || rangeErrorPill ? (
          <div className="flex min-w-0 items-center gap-1">
            {trackNamePill}
            {rangeErrorPill && <div className="shrink-0">{rangeErrorPill}</div>}
          </div>
        ) : undefined
      }
      actions={
        !isDisabled ? (
          <IconActionButton
            aria-label={t("actions.delete.label")}
            icon={<Icon iconSet="16" iconName="delete" />}
            variant="dark"
            onPress={handleDeleteMask}
          />
        ) : undefined
      }
    />
  );
};
