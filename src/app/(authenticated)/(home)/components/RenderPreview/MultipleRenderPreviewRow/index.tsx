import { SbsComparisonTrackSettings } from "@home/components/RenderPreview/SbsComparison/SbsComparisonTrackSettings";
import { TrackSettingsListPanel } from "@home/components/RenderPreview/SbsComparison/SbsTrackSettingsList/TrackSettingsList";
import { SettingsDisplay } from "@home/components/RenderPreview/SbsComparison/types";
import { TrackPreviewContainer } from "@home/components/VideoPreview";
import { Layer } from "@schemas/layer";
import { useState } from "react";

interface Props {
  leftTrack: Layer | undefined;
  rightTrack: Layer | undefined;
  settingsToDisplay: SettingsDisplay[];
  isDisclosureOpen?: boolean;
  onDisclosureChange?: (open: boolean) => void;
  reducedPadding?: boolean;
  stackVertically?: boolean;
}

export const RenderPreviewRow: React.FC<Props> = ({
  leftTrack,
  rightTrack,
  settingsToDisplay,
  isDisclosureOpen,
  onDisclosureChange,
  reducedPadding = false,
  stackVertically = false
}) => {
  const [leftVideoType, setLeftVideoType] = useState("video");
  const [rightVideoType, setRightVideoType] = useState("video");
  const [lastLeftTrackId, setLastLeftTrackId] = useState(leftTrack?.id);
  const [lastRightTrackId, setLastRightTrackId] = useState(rightTrack?.id);

  if (leftTrack?.id !== lastLeftTrackId) {
    setLastLeftTrackId(leftTrack?.id);
    setLeftVideoType("video");
  }
  if (rightTrack?.id !== lastRightTrackId) {
    setLastRightTrackId(rightTrack?.id);
    setRightVideoType("video");
  }

  const paddingY = reducedPadding ? "p-0" : "p-6";
  const containerDirection = stackVertically ? "flex-col" : "flex-row";

  if (!stackVertically) {
    return (
      <div className="flex flex-col h-full w-full min-h-0">
        <div
          className={`flex flex-row flex-1 min-h-0 w-full ${
            reducedPadding ? "gap-2" : "gap-6"
          }`}
        >
          <div
            className={`flex flex-1 items-center justify-center overflow-hidden ${paddingY} object-contain select-none min-w-0 min-h-0`}
          >
            <TrackPreviewContainer
              selectedTrack={leftTrack}
              selectedVideoType={leftVideoType}
              onSelectedVideoTypeChange={setLeftVideoType}
            />
          </div>
          <div
            className={`flex flex-1 items-center justify-center overflow-hidden ${paddingY} object-contain select-none min-w-0 min-h-0`}
          >
            <TrackPreviewContainer
              selectedTrack={rightTrack}
              selectedVideoType={rightVideoType}
              onSelectedVideoTypeChange={setRightVideoType}
            />
          </div>
        </div>

        <SbsComparisonTrackSettings
          className="static left-auto bottom-auto z-auto"
          leftTrack={leftTrack}
          rightTrack={rightTrack}
          settingsToDisplay={settingsToDisplay}
          isDisclosureOpen={isDisclosureOpen}
          onDisclosureChange={onDisclosureChange}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${containerDirection} h-full w-full min-h-0 ${
        reducedPadding ? "gap-2" : "gap-6"
      }`}
    >
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <div
          className={`flex flex-1 items-center justify-center overflow-hidden ${paddingY} object-contain select-none min-w-0 min-h-0`}
        >
          <TrackPreviewContainer
            selectedTrack={leftTrack}
            selectedVideoType={leftVideoType}
            onSelectedVideoTypeChange={setLeftVideoType}
          />
        </div>
        <TrackSettingsListPanel
          trackName={leftTrack?.name || "Track not selected"}
          oneTrackSettings={settingsToDisplay[0] ?? []}
          isDisclosureOpen={isDisclosureOpen}
          onDisclosureChange={onDisclosureChange}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <div
          className={`flex flex-1 items-center justify-center overflow-hidden ${paddingY} object-contain select-none min-w-0 min-h-0`}
        >
          <TrackPreviewContainer
            selectedTrack={rightTrack}
            selectedVideoType={rightVideoType}
            onSelectedVideoTypeChange={setRightVideoType}
          />
        </div>
        <TrackSettingsListPanel
          trackName={rightTrack?.name || "Track not selected"}
          oneTrackSettings={settingsToDisplay[1] ?? []}
          isDisclosureOpen={isDisclosureOpen}
          onDisclosureChange={onDisclosureChange}
        />
      </div>
    </div>
  );
};
