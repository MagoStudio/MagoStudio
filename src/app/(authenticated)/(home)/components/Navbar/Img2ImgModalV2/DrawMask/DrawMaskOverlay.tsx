import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { getAssetDimensions } from "@domains/asset/utils/getAssetDimensions";
import { useContainFitDimensions } from "@domains/sam/useContainFitDimensions";
import { useInputTrack } from "@domains/track/useInputTrack";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { useInitialValue } from "@hooks/useInitialValue";
import { useLatestRef } from "@hooks/useLatestRef";
import { useMountEffect } from "@hooks/useMountEffect";
import { useSetAtom } from "jotai";
import React, { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Seedream5ProType } from "../schemas/seedream5Pro.schema";

import { MASK_COLOR, MASK_OPACITY } from "./constants";
import { drawMaskActiveAtom } from "./drawMaskAtom";
import { useBrushCursor } from "./hooks/useBrushCursor";
import { useMaskCanvas } from "./hooks/useMaskCanvas";
import { MaskDrawSettingsBar } from "./MaskDrawSettingsBar";
import type { MaskTool } from "./types";
import {
  BRUSH_DEFAULT_STEP,
  BRUSH_MAX_STEP,
  BRUSH_MIN_STEP,
  brushSizeForStep
} from "./utils/brushSizeForStep";
import { clearDrawnMask } from "./utils/clearDrawnMask";

const PREVIEW_HIDE_DELAY_MS = 700;

type Props = {
  frameIdx: number;
};

export const DrawMaskOverlay: React.FC<Props> = ({ frameIdx }) => {
  const { t } = useTranslation();
  const setActive = useSetAtom(drawMaskActiveAtom);
  const { setValue, getValues } = useFormContext<Seedream5ProType>();

  const pinnedFrameIdx = useInitialValue(frameIdx);

  const { inputTrack } = useInputTrack();
  const { inputTrackFrameSrc } = useInputTrackFrameSrc({
    frameNumber: pinnedFrameIdx
  });
  const { width, height } = getAssetDimensions(getTrackAssetData(inputTrack));
  const naturalWidth = width || 0;
  const naturalHeight = height || 0;

  const [tool, setTool] = useState<MaskTool>("draw");
  const [brushStep, setBrushStep] = useState(BRUSH_DEFAULT_STEP);
  const brushPx = brushSizeForStep(brushStep);

  const [isBrushPreviewVisible, setBrushPreviewVisible] = useState(false);
  const previewHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleBrushStepChange = (step: number) => {
    setBrushStep(step);
    setBrushPreviewVisible(true);
    if (previewHideTimer.current) {
      clearTimeout(previewHideTimer.current);
    }
    previewHideTimer.current = setTimeout(
      () => setBrushPreviewVisible(false),
      PREVIEW_HIDE_DELAY_MS
    );
  };

  const {
    canvasRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    clear,
    toDataURL,
    loadFromDataUrl,
    hasInteracted
  } = useMaskCanvas({ naturalWidth, naturalHeight, tool, brushPx });
  const brushCursor = useBrushCursor();
  const {
    containerRef: imageBoundsRef,
    fitDimensions,
    handleImgLoad
  } = useContainFitDimensions();

  const brushStepRef = useLatestRef(brushStep);
  const cursorVisibleRef = useLatestRef(brushCursor.cursor.visible);

  useMountEffect(() => {
    const existing = getValues("maskLayerDataUrl");
    if (existing && getValues("maskFrameIdx") === pinnedFrameIdx) {
      loadFromDataUrl(existing);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!cursorVisibleRef.current) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleBrushStepChange(
          Math.min(BRUSH_MAX_STEP, brushStepRef.current + 1)
        );
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleBrushStepChange(
          Math.max(BRUSH_MIN_STEP, brushStepRef.current - 1)
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previewHideTimer.current) {
        clearTimeout(previewHideTimer.current);
      }
    };
  });

  const handleSave = () => {
    if (!hasInteracted()) {
      setActive(false);
      return;
    }
    const dataUrl = toDataURL();
    if (!dataUrl) {
      clearDrawnMask(setValue);
      setActive(false);
      return;
    }

    setValue("maskLayerDataUrl", dataUrl);
    setValue("maskedFrameSrc", inputTrackFrameSrc ?? undefined);
    setValue("maskFrameIdx", pinnedFrameIdx);
    setActive(false);
  };

  const handleCancel = () => {
    setActive(false);
  };

  const canDraw = naturalWidth > 0 && naturalHeight > 0;

  return (
    <div
      data-testid="draw-mask-overlay"
      className="relative flex h-full w-full flex-col bg-surface-primary"
    >
      <div className="flex items-center justify-end gap-2 bg-surface-secondary p-3">
        <MainButton
          variant="solid"
          colorScheme="secondary"
          size="sm"
          className="px-4"
          onPress={handleCancel}
        >
          {t("img2imgForms.draw_mask.cancel")}
        </MainButton>
        <MainButton
          variant="solid"
          colorScheme="primary"
          size="sm"
          className="min-w-[77px] pl-3 pr-4"
          onPress={handleSave}
        >
          {t("img2imgForms.draw_mask.save")}
        </MainButton>
      </div>

      <div
        ref={imageBoundsRef}
        className="relative flex min-h-0 flex-1 items-center justify-center bg-black"
      >
        {canDraw && inputTrackFrameSrc ? (
          <div
            className="relative"
            style={
              fitDimensions
                ? { width: fitDimensions.width, height: fitDimensions.height }
                : undefined
            }
            onPointerLeave={brushCursor.onPointerLeave}
            onPointerMove={brushCursor.onPointerMove}
          >
            <img
              src={inputTrackFrameSrc}
              alt=""
              onLoad={handleImgLoad}
              className="block h-full w-full select-none"
              draggable={false}
            />
            <canvas
              ref={canvasRef}
              data-testid="draw-mask-canvas"
              width={naturalWidth}
              height={naturalHeight}
              style={{ opacity: MASK_OPACITY }}
              className="absolute inset-0 h-full w-full cursor-none touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
            {/* Brush cursor: shows exactly what will change — a filled red disc
                when drawing, a 1px-stroke outline when erasing. */}
            {brushCursor.cursor.visible && (
              <div
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: brushCursor.cursor.x,
                  top: brushCursor.cursor.y,
                  width: brushPx,
                  height: brushPx,
                  transform: "translate(-50%, -50%)",
                  backgroundColor:
                    tool === "draw" ? `${MASK_COLOR}E6` : "transparent",
                  border:
                    tool === "erase"
                      ? "1px solid rgba(255,255,255,0.9)"
                      : "none"
                }}
              />
            )}
          </div>
        ) : (
          <Text variant="md" color="glyph-secondary">
            {t("img2imgForms.draw_mask.hint")}
          </Text>
        )}
      </div>

      <MaskDrawSettingsBar
        tool={tool}
        onToolChange={setTool}
        onClearAll={clear}
        brushStep={brushStep}
        onBrushStepChange={handleBrushStepChange}
        brushPx={brushPx}
        isBrushPreviewVisible={isBrushPreviewVisible}
      />
    </div>
  );
};
