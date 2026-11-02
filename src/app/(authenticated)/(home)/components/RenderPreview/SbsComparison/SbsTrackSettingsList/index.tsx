import { TrackSettingsList } from "@home/components/RenderPreview/SbsComparison/SbsTrackSettingsList/TrackSettingsList";
import { SettingsDisplay } from "@home/components/RenderPreview/SbsComparison/types";
import React from "react";

type Props = {
  settingsToDisplay: SettingsDisplay[];
};

export const SbsTrackSettingsList: React.FC<Props> = ({
  settingsToDisplay
}) => {
  return (
    <div
      className="grid grid-cols-2 grid-rows-1 gap-x-4 py-4 w-full max-h-[9.5rem] overflow-y-scroll overflow-x-hidden scrollbar-custom"
      aria-label="Comparison track settings list"
    >
      {settingsToDisplay.map((oneTrackSettings, index) => {
        return oneTrackSettings ? (
          <TrackSettingsList
            key={`${index}-track-settings`}
            oneTrackSettings={oneTrackSettings}
          />
        ) : (
          <div key={`${index}-track-settings-empty`} />
        );
      })}
    </div>
  );
};
