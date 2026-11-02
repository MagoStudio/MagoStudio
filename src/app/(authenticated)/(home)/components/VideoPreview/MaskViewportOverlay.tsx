"use client";

import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { InfoBlock } from "@components/InfoBlock";
import { Text } from "@components/Text";
import { useContainFitDimensions } from "@domains/sam/useContainFitDimensions";
import { useMaskPointInteraction } from "@domains/sam/useMaskPointInteraction";
import {
  parseMaskPoints,
  serializeMaskPoints
} from "@domains/sam/utils/parseMaskPoints";
import { useInputTrack } from "@domains/track/useInputTrack";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import {
  getTimelineOffset,
  toSourceFrame
} from "@domains/track/utils/frameCoordinates";
import { MaskPointMarkers } from "@home/components/renderSettingsComponents/MaskPointMarkers";
import { MaskPointToolbar } from "@home/components/renderSettingsComponents/MaskPointToolbar";
import {
  MaskPreviewPoint,
  maskViewportActiveAtom
} from "@store/maskPreviewStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

export const MaskViewportOverlay: React.FC = () => {
  const { t } = useTranslation();
  const setViewportActive = useSetAtom(maskViewportActiveAtom);

  const { renderSettingsValuesAtom, updateValueAtom } =
    useRenderSettingsAtoms();
  const renderSettings = useAtomValue(renderSettingsValuesAtom);
  const updateValue = useSetAtom(updateValueAtom);

  const points = parseMaskPoints(
    renderSettings?.mask_visual_selection as string
  );
  const setPoints = (newPoints: MaskPreviewPoint[]) => {
    updateValue({
      key: "mask_visual_selection",
      value: serializeMaskPoints(newPoints)
    });
  };

  const maskFrameIdx =
    (renderSettings?.mask_frame_idx as number | undefined) ?? 0;
  const { inputTrack } = useInputTrack();
  const frameNumber = toSourceFrame({
    outputFrame: maskFrameIdx,
    offset: getTimelineOffset(inputTrack)
  });

  const { handleClick } = useMaskPointInteraction({ points, setPoints });
  const { inputTrackFrameSrc } = useInputTrackFrameSrc({
    frameNumber
  });

  const { containerRef, fitDimensions, handleImgLoad } =
    useContainFitDimensions();

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-black/80">
      <div className="flex justify-end px-3 py-2 shrink-0">
        <IconActionButton
          icon={<Icon iconSet="16" iconName="cross" />}
          size="sm"
          variant="dark"
          onPress={() => setViewportActive(false)}
          aria-label={t("actions.close.label")}
        />
      </div>

      <div className="relative flex flex-1 min-h-0 flex-col">
        <div className="flex flex-1 min-h-0 flex-col cursor-crosshair items-stretch overflow-hidden p-4 gap-3">
          {inputTrackFrameSrc ? (
            <>
              <div
                ref={containerRef}
                className="flex flex-1 min-h-0 items-center justify-center"
              >
                <div
                  className="relative"
                  style={
                    fitDimensions
                      ? {
                          width: fitDimensions.width,
                          height: fitDimensions.height
                        }
                      : undefined
                  }
                  onClick={handleClick}
                >
                  <img
                    src={inputTrackFrameSrc}
                    alt=""
                    onLoad={handleImgLoad}
                    className="block h-full w-full"
                  />

                  <MaskPointMarkers points={points} />
                </div>
              </div>

              <div className="self-start max-w-[320px]">
                <InfoBlock>
                  {t("masking.visual_selection.editor_hint.label")}
                </InfoBlock>
              </div>
            </>
          ) : (
            <Text variant="base" color="glyph-secondary">
              {t("masking.visual_selection.no_input_track.label")}
            </Text>
          )}
        </div>

        {inputTrackFrameSrc && (
          <div className="px-3 py-2 bg-[rgba(28,28,28,0.9)]">
            <MaskPointToolbar onClearPoints={() => setPoints([])} />
          </div>
        )}

        {inputTrackFrameSrc && points.length === 0 && (
          <>
            <div className="absolute inset-0 bg-[rgba(13,13,13,0.6)] pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <InfoBlock showIcon={false}>
                {t("masking.visual_selection.editor_empty_state.label")}
              </InfoBlock>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
