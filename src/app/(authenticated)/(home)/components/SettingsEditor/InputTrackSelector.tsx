import { CircularProgress } from "@components/CircularProgress";
import { Dropdown, DropdownItem } from "@components/Dropdown";
import { GhostButton } from "@components/GhostButton";
import { Tooltip } from "@components/Tooltip";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useGetTracksById } from "@domains/track/useGetTracksById";
import { useGoBackToSourceVideo } from "@domains/track/useGoBackToSourceVideo";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import { useSelectableInputTracks } from "@domains/track/useSelectableInputTracks";
import { useSetSelectedTrackIds } from "@domains/track/useSetSelectedTrackIds";
import {
  isIteratedTooltipVisibleAtom,
  useInputTrackIdAtom
} from "@store/atoms";
import { cn } from "@utils";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const InputTrackSelector: React.FC = () => {
  const { t } = useTranslation();
  const [selectElement, setSelectElement] = useState<HTMLDivElement | null>(
    null
  );

  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();

  const { data: filteredTracks } = useFilteredAndSortedTracks();
  const baseVideoTrack = filteredTracks?.videoTrack;
  const { inputTrackFrameSrc, isLoading: isInputTrackFrameLoading } =
    useInputTrackFrameSrc({ frameNumber: 0 });

  const inputTrackIdAtom = useInputTrackIdAtom();
  const inputTrackId = useAtomValue(inputTrackIdAtom);
  const setInputTrackId = useSetAtom(inputTrackIdAtom);

  const selectableInputTrackIds = useSelectableInputTracks();

  const { data: selectableTracks } = useGetTracksById({
    trackIds: selectableInputTrackIds,
    selectedProjectId,
    selectedShotId
  });

  const selectItems: DropdownItem[] = (selectableTracks || []).map((track) => ({
    key: track.id,
    label: track.name
  }));

  const setSelectedTrackIds = useSetSelectedTrackIds();

  const goBackToSourceVideo = useGoBackToSourceVideo();

  const isResetButtonDisabled = inputTrackId === baseVideoTrack?.id;

  const isIteratedTooltipVisible = useAtomValue(isIteratedTooltipVisibleAtom);

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-start gap-1 w-full">
        <div className="flex items-center justify-center w-16 min-w-16 h-8 rounded-md bg-element-primary overflow-hidden">
          {isInputTrackFrameLoading || !inputTrackFrameSrc ? (
            <CircularProgress size="xs" color="glyph-tertiary" />
          ) : (
            <img
              src={inputTrackFrameSrc}
              alt="selected input track"
              className="w-full h-full object-contain"
            />
          )}
        </div>
        <Tooltip
          isVisible={isIteratedTooltipVisible}
          noArrow
          placement="top"
          textContent={t(
            "notifications.your_input_video_was_changed.description"
          )}
          targetElement={selectElement}
          className="bg-element-success text-sm"
        />
        <Dropdown
          ref={setSelectElement}
          aria-label={t("titles.input_track_selector.label")}
          items={selectItems}
          value={inputTrackId ?? null}
          onChange={(key) => {
            setInputTrackId(key as string);
            setSelectedTrackIds([key as string]);
          }}
          className={cn(
            "border rounded-sm -mb-0.25",
            isResetButtonDisabled ? "w-[19.25rem]" : "w-[9.75rem]",
            isIteratedTooltipVisible
              ? "border-glyph-success"
              : "border-transparent"
          )}
        />
        {!isResetButtonDisabled && (
          <GhostButton
            onPress={goBackToSourceVideo}
            colorScheme="stroke"
            className="!h-8"
          >
            {t("actions.go_back_to_source_video.label")}
          </GhostButton>
        )}
      </div>
    </div>
  );
};
