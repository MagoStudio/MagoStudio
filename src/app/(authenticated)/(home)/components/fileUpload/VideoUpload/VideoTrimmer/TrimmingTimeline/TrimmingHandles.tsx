import { Icon } from "@components/Icon";
import { DECIMAL_PRECISION } from "@constants";
import { ceilToPrecision } from "@utils";

import {
  createCenterHandleMouseHandler,
  createSelectorMouseHandler
} from "./utils";

const PERCENTAGE_MULTIPLIER = 100;

interface TrimmingHandlesProps {
  timelineRef: React.RefObject<HTMLDivElement | null>;
  videoDuration: number;
  minTrimTime: number;
  maxTrimTime: number;
  disabled: boolean;
  handleMinTimeChange: (time: number) => void;
  handleMaxTimeChange: (time: number) => void;
  handleBothTimesChange: (newMin: number, newMax: number) => void;
}

export const TrimmingHandles: React.FC<TrimmingHandlesProps> = ({
  timelineRef,
  videoDuration,
  minTrimTime,
  maxTrimTime,
  disabled,
  handleMinTimeChange,
  handleMaxTimeChange,
  handleBothTimesChange
}) => {
  const leftPercentage =
    videoDuration > 0
      ? (minTrimTime / videoDuration) * PERCENTAGE_MULTIPLIER
      : 0;

  let rightPercentage = PERCENTAGE_MULTIPLIER;

  if (videoDuration > 0) {
    if (
      ceilToPrecision(videoDuration, DECIMAL_PRECISION) ===
      ceilToPrecision(maxTrimTime, DECIMAL_PRECISION)
    ) {
      rightPercentage = PERCENTAGE_MULTIPLIER;
    } else {
      rightPercentage = (maxTrimTime / videoDuration) * PERCENTAGE_MULTIPLIER;
    }
  }

  const handleLeftSelectorMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    createSelectorMouseHandler({
      direction: "left",
      timelineRef,
      videoDuration,
      handleMinTimeChange,
      handleMaxTimeChange
    })(e);
  };

  const handleRightSelectorMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    createSelectorMouseHandler({
      direction: "right",
      timelineRef,
      videoDuration,
      handleMinTimeChange,
      handleMaxTimeChange
    })(e);
  };

  const handleCenterHandleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    createCenterHandleMouseHandler({
      timelineRef,
      videoDuration,
      handleBothTimesChange,
      minTrimTime,
      maxTrimTime
    })(e);
  };

  return (
    <div className="absolute top-0 left-0 w-[calc(100%-32px)] ml-4 pointer-events-none">
      <div
        className="absolute top-0 left-0 h-6 w-4 border-2 border-code-200 pointer-events-none"
        style={{
          width: `calc(${rightPercentage - leftPercentage}% + 12px)`,
          left: `calc(${leftPercentage}% - 6px)`,
          zIndex: 2
        }}
      />
      <div
        className="absolute w-4 h-6 bg-code-200 pt-1 pr-1 cursor-pointer pointer-events-auto -ml-4"
        style={{
          left: `calc(${leftPercentage}% - 2px)`,
          borderTopLeftRadius: "4px"
        }}
        onMouseDown={handleLeftSelectorMouseDown}
      >
        <Icon
          iconSet="16-technical"
          iconName="drag-handle"
          className="text-glyph-invert-main"
        />
        <div
          className="absolute -right-1 top-0.5 w-1 h-1"
          style={{
            background:
              "radial-gradient(ellipse at bottom right, transparent 0%, transparent 70%, var(--color-code-200) 70%)"
          }}
        />
        <div
          className="absolute -right-1 bottom-0.5 w-1 h-1"
          style={{
            background:
              "radial-gradient(ellipse at top right, transparent 0%, transparent 70%, var(--color-code-200) 70%)"
          }}
        />
      </div>
      <div
        className="absolute w-4 h-6 bg-code-200 pt-1 pr-1 cursor-grab pointer-events-auto rounded-tr-[4px]"
        style={{
          left: `calc(${rightPercentage}% + 2px)`
        }}
        onMouseDown={handleRightSelectorMouseDown}
      >
        <Icon
          iconSet="16-technical"
          iconName="drag-handle"
          className="text-glyph-invert-main"
        />
        <div
          className="absolute -left-1 top-0.5 w-1 h-1"
          style={{
            background:
              "radial-gradient(ellipse at bottom left, transparent 0%, transparent 70%, var(--color-code-200) 70%)"
          }}
        />
        <div
          className="absolute -left-1 bottom-0.5 w-1 h-1"
          style={{
            background:
              "radial-gradient(ellipse at top left, transparent 0%, transparent 70%, var(--color-code-200) 70%)"
          }}
        />
      </div>
      <div
        className="absolute top-6 h-2 bg-code-200 cursor-grab pointer-events-auto active:cursor-grabbing flex items-center justify-center pb-0.5 rounded-b-[4px] z-3"
        style={{
          left: `calc(${leftPercentage}% - 18px)`,
          width: `calc(${rightPercentage - leftPercentage}% + 36px)`
        }}
        onMouseDown={handleCenterHandleMouseDown}
      >
        <Icon
          iconSet="16-technical"
          iconName="drag-handle"
          className="text-glyph-invert-main rotate-90 mt-0.5"
        />
      </div>
    </div>
  );
};
