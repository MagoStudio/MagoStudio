"use client";

import { InfoBlock } from "@components/InfoBlock";
import { Text } from "@components/Text";
import { useContainFitDimensions } from "@domains/sam/useContainFitDimensions";
import { useOpenMaskEditor } from "@domains/sam/useOpenMaskEditor";
import { parseMaskPoints } from "@domains/sam/utils/parseMaskPoints";
import { useInputTrack } from "@domains/track/useInputTrack";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import {
  getTimelineOffset,
  toSourceFrame
} from "@domains/track/utils/frameCoordinates";
import { maskViewportActiveAtom } from "@store/maskPreviewStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "./interface";
import { MaskFrameSelector } from "./MaskFrameSelector";
import { MaskPointMarkers } from "./MaskPointMarkers";

export const VisualMaskSelection: React.FC<
  RenderSettingComponentProps<string>
> = ({ value }) => {
  const { t } = useTranslation();
  const isViewportActive = useAtomValue(maskViewportActiveAtom);
  const openEditor = useOpenMaskEditor();
  const { renderSettingsValuesAtom } = useRenderSettingsAtoms();
  const renderSettings = useAtomValue(renderSettingsValuesAtom);
  const maskFrameIdx =
    (renderSettings?.mask_frame_idx as number | undefined) ?? 0;
  const { inputTrack } = useInputTrack();
  const frameNumber = toSourceFrame({
    outputFrame: maskFrameIdx,
    offset: getTimelineOffset(inputTrack)
  });

  const points = parseMaskPoints(value);
  const hasPoints = points.length > 0;
  const { inputTrackFrameSrc, isLoading } = useInputTrackFrameSrc({
    frameNumber
  });

  const { containerRef, fitDimensions, handleImgLoad } =
    useContainFitDimensions();

  if (!inputTrackFrameSrc && !isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Text variant="sm" color="glyph-tertiary">
          {t("masking.visual_selection.no_input_track.label")}
        </Text>
      </div>
    );
  }

  if (isViewportActive) {
    return (
      <div
        data-testid="visual-mask-selection"
        className="flex flex-col gap-2 w-full"
      >
        <div className="flex items-center justify-center w-full">
          <MaskFrameSelector />
        </div>
      </div>
    );
  }

  const openMaskEditorLabel = t(
    "masking.visual_selection.open_mask_editor.label"
  );

  return (
    <div
      data-testid="visual-mask-selection"
      data-mask-frame-idx={maskFrameIdx}
      className="flex flex-col gap-2 w-full"
    >
      <div
        ref={containerRef}
        className="flex items-center justify-center w-full h-[300px]"
      >
        <div
          className="relative overflow-hidden bg-surface-bg-200"
          style={
            fitDimensions
              ? { width: fitDimensions.width, height: fitDimensions.height }
              : undefined
          }
        >
          {inputTrackFrameSrc && (
            <img
              src={inputTrackFrameSrc}
              alt=""
              onLoad={handleImgLoad}
              className="block h-full w-full"
            />
          )}

          <MaskPointMarkers points={points} />

          {hasPoints ? (
            <button
              type="button"
              onClick={openEditor}
              aria-label={openMaskEditorLabel}
              className="absolute inset-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-glyph-action-main focus-visible:ring-offset-1"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[rgba(13,13,13,0.6)]" />
              <div className="absolute inset-0 flex items-center justify-center p-3">
                <button
                  type="button"
                  onClick={openEditor}
                  aria-label={openMaskEditorLabel}
                >
                  <InfoBlock showIcon={false}>{openMaskEditorLabel}</InfoBlock>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
