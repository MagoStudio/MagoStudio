import { useAspectRatio } from "@context/AspectRatioContext";
import { SbsComparisonTrackSettings } from "@home/components/RenderPreview/SbsComparison/SbsComparisonTrackSettings";
import { useSliderPosition } from "@hooks/useSliderPosition";
import { Layer } from "@schemas/layer";
import { isViewportFullscreenOpenAtom } from "@store/atoms";
import { cn } from "@utils";
import { useAtomValue } from "jotai";
import { useState, useRef } from "react";

import { SbsTool } from "./SbsTool";
import { SbsVideoPlayer } from "./SbsVideoPlayer";
import { SettingsDisplay } from "./types";

const MAX_POSITION_PERCENT = 100;

interface Props {
  firstSelectedLayer?: Layer;
  secondSelectedLayer?: Layer;
  settingsToDisplay?: SettingsDisplay[];
}

export const SbsComparison: React.FC<Props> = ({
  firstSelectedLayer,
  secondSelectedLayer,
  settingsToDisplay = []
}) => {
  const { aspectRatio } = useAspectRatio();
  const [firstSwitcherContainer, setFirstSwitcherContainer] =
    useState<HTMLDivElement | null>(null);
  const [secondSwitcherContainer, setSecondSwitcherContainer] =
    useState<HTMLDivElement | null>(null);

  const firstControlNetOverride = firstSelectedLayer?.data?.controlNetOverride;
  const secondControlNetOverride =
    secondSelectedLayer?.data?.controlNetOverride;

  const [leftVideoType, setLeftVideoType] = useState(
    firstControlNetOverride?.name ?? "video"
  );
  const [rightVideoType, setRightVideoType] = useState(
    secondControlNetOverride?.name ?? "video"
  );

  const [lastFirstLayerId, setLastFirstLayerId] = useState(
    firstSelectedLayer?.id
  );
  const [lastFirstOverride, setLastFirstOverride] = useState(
    firstControlNetOverride
  );
  if (
    firstSelectedLayer?.id !== lastFirstLayerId ||
    firstControlNetOverride !== lastFirstOverride
  ) {
    setLastFirstLayerId(firstSelectedLayer?.id);
    setLastFirstOverride(firstControlNetOverride);
    setLeftVideoType(firstControlNetOverride?.name ?? "video");
  }

  const [lastSecondLayerId, setLastSecondLayerId] = useState(
    secondSelectedLayer?.id
  );
  const [lastSecondOverride, setLastSecondOverride] = useState(
    secondControlNetOverride
  );
  if (
    secondSelectedLayer?.id !== lastSecondLayerId ||
    secondControlNetOverride !== lastSecondOverride
  ) {
    setLastSecondLayerId(secondSelectedLayer?.id);
    setLastSecondOverride(secondControlNetOverride);
    setRightVideoType(secondControlNetOverride?.name ?? "video");
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const baseImageRef = useRef<HTMLDivElement>(null);

  const { sliderPosition, handleSliderMouseDown } = useSliderPosition({
    containerRef: baseImageRef
  });

  const isViewportFullscreenOpen = useAtomValue(isViewportFullscreenOpenAtom);

  return (
    <div className="h-full w-full flex flex-col justify-center items-center">
      <div
        className={cn(
          "absolute left-0 w-full grid grid-cols-2 gap-0 z-10",
          isViewportFullscreenOpen ? "top-11" : "top-6"
        )}
      >
        <div
          ref={setFirstSwitcherContainer}
          className={"flex justify-end items-end pr-2"}
        />
        <div
          ref={setSecondSwitcherContainer}
          className={"flex justify-end items-end pr-2"}
        />
      </div>
      <div
        className="relative overflow-hidden flex items-center justify-center py-0 h-auto w-full"
        ref={containerRef}
        style={{ aspectRatio: `${aspectRatio[0]} / ${aspectRatio[1]}` }}
      >
        <div className={"relative h-full w-full isolate"}>
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-full z-0"
            style={{
              clipPath: `inset(0 ${MAX_POSITION_PERCENT - sliderPosition}% 0 0)`
            }}
            ref={baseImageRef}
          >
            {firstSelectedLayer && (
              <SbsVideoPlayer
                selectedLayer={firstSelectedLayer}
                switcherContainer={firstSwitcherContainer}
                selectedVideoType={leftVideoType}
                onSelectedVideoTypeChange={setLeftVideoType}
              />
            )}
          </div>

          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-full z-1"
            style={{
              clipPath: `inset(0 0 0 ${sliderPosition}%)`
            }}
          >
            {secondSelectedLayer && (
              <SbsVideoPlayer
                selectedLayer={secondSelectedLayer}
                switcherContainer={secondSwitcherContainer}
                selectedVideoType={rightVideoType}
                onSelectedVideoTypeChange={setRightVideoType}
              />
            )}
          </div>

          <div
            className="absolute top-0 bottom-0 z-10 -translate-x-1/2 cursor-ew-resize select-none"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={handleSliderMouseDown}
          >
            <SbsTool />
          </div>
        </div>
      </div>

      <SbsComparisonTrackSettings
        leftTrack={firstSelectedLayer}
        rightTrack={secondSelectedLayer}
        settingsToDisplay={[settingsToDisplay[0], settingsToDisplay[1]]}
      />
    </div>
  );
};
