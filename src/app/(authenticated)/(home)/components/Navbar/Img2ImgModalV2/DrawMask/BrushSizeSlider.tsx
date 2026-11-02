import { Text } from "@components/Text";
import { cn } from "@utils";
import React from "react";
import {
  Slider as AriaSlider,
  SliderThumb,
  SliderTrack
} from "react-aria-components/Slider";

import { MASK_COLOR } from "./constants";
import type { MaskTool } from "./types";
import { BRUSH_MAX_STEP, BRUSH_MIN_STEP } from "./utils/brushSizeForStep";

const PREVIEW_TRANSITION =
  "width 220ms cubic-bezier(.2,.7,.2,1), height 220ms cubic-bezier(.2,.7,.2,1), opacity 150ms ease";

type Props = {
  value: number;
  onChange: (step: number) => void;
  label: string;
  tool: MaskTool;
  brushPx: number;
  isPreviewVisible: boolean;
};

export const BrushSizeSlider: React.FC<Props> = ({
  value,
  onChange,
  label,
  tool,
  brushPx,
  isPreviewVisible
}) => {
  return (
    <div className="flex items-center gap-1.5 px-2">
      <Text variant="sm" color="glyph-tertiary" whiteSpace="nowrap">
        {label}
      </Text>

      <AriaSlider
        aria-label={label}
        className="group relative flex w-[94px] items-center"
        minValue={BRUSH_MIN_STEP}
        maxValue={BRUSH_MAX_STEP}
        step={1}
        value={value}
        onChange={onChange}
      >
        <div
          className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-full"
          style={{
            width: brushPx,
            height: brushPx,
            backgroundColor:
              tool === "draw" ? `${MASK_COLOR}E6` : "transparent",
            border:
              tool === "erase" ? "1px solid rgba(255,255,255,0.9)" : "none",
            opacity: isPreviewVisible ? 1 : 0,
            transition: PREVIEW_TRANSITION
          }}
        />
        <SliderTrack className="relative h-6 w-full cursor-pointer">
          {({ state }) => {
            const fill = state.getThumbPercent(0) * 100;
            return (
              <>
                <div className="absolute top-1/2 h-4 w-full -translate-y-1/2 rounded bg-element-primary" />
                <div
                  className="absolute top-1/2 h-4 -translate-y-1/2 rounded-l bg-element-tertiary"
                  style={{ width: `${fill}%` }}
                />
                <SliderThumb
                  className={cn(
                    "absolute top-1/2 h-6 w-2 rounded outline-hidden",
                    "bg-glyph-secondary group-hover:bg-glyph-primary"
                  )}
                />
              </>
            );
          }}
        </SliderTrack>
      </AriaSlider>
    </div>
  );
};
