import { rulerHeightSize } from "@styles/themeValues";
import { memo } from "react";

import { TrackRangeOverlay } from "../TracksList/RenderTrackItem/TrackDetails/TrackRangeOverlay";

import { Cursor } from "./Cursor";
import { PlayButton } from "./PlayButton";
import { RangeSlider } from "./RangeSlider";
import { Ruler } from "./Ruler";

interface TimePanelProps {
  disabled?: boolean;
}

export const TimePanel: React.FC<TimePanelProps> = memo(({ disabled }) => {
  return (
    <div className={"sticky z-20 top-0 flex items-center bg-element-primary"}>
      <PlayButton />
      <div className={"px-2 w-timeline-container"}>
        <div
          className={
            "flex flex-col justify-center w-timeline-tools bg-element-primary pointer-events-auto"
          }
        >
          <div className={"relative h-rangeSlider w-full pr-2"}>
            <RangeSlider disabled={disabled} />
          </div>

          <Ruler disabled={disabled} height={rulerHeightSize} />

          {disabled ? null : <Cursor />}
          <TrackRangeOverlay />
        </div>
      </div>
    </div>
  );
});

TimePanel.displayName = "TimePanel";
