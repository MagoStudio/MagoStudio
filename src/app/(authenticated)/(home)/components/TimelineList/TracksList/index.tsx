import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { getTrackInputVideoId } from "@domains/track/utils/getTrackInputVideoId";
import { isMaskTrack } from "@domains/track/utils/isMaskTrack";
import { useQueue } from "@hooks/queue/useQueue";
import { useTool } from "@hooks/tool/useTool";
import { useHandleTrackNavigation } from "@hooks/useHandleTrackNavigation";
import { Layer } from "@schemas/layer";
import { useInputTrackIdAtom } from "@store/atoms";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { GridListItem, GridList } from "react-aria-components/GridList";

import { useHandleFrameNavigation } from "../TimelineControls/useHandleFrameNavigation";

import { getTrackIdWithDoneStatus } from "./getTrackIdWithDoneStatus";
import { InputVideoTrackItem } from "./InputVideoTrackItem";
import { RenderTrackItem } from "./RenderTrackItem";

export const TracksList: React.FC = () => {
  const { data: queue } = useQueue();
  const [renamingTrackId, setRenamingTrackId] = useState<Layer["id"] | null>(
    null
  );

  const {
    data: { videoTrack, tracks }
  } = useFilteredAndSortedTracks();
  const { tool: projectMode } = useTool();

  const inputTrackIdAtom = useInputTrackIdAtom();
  const inputTrackId = useAtomValue(inputTrackIdAtom);
  const isMaskTab = projectMode === "mask";

  const inputTrackRow = isMaskTab
    ? (tracks.find((t) => t.id === inputTrackId) ?? videoTrack)
    : videoTrack;

  const visibleTracks = isMaskTab
    ? tracks.filter(
        (t) => isMaskTrack(t) && getTrackInputVideoId(t) === inputTrackRow.id
      )
    : tracks.filter((track) => !isMaskTrack(track));

  const trackIdWithDoneStatus = getTrackIdWithDoneStatus(visibleTracks, queue);

  const handleFrameNavigation = useHandleFrameNavigation();
  const handleTrackNavigation = useHandleTrackNavigation();

  const handleKeyDownCapture = (e: React.KeyboardEvent) => {
    if (renamingTrackId) {
      if (e.key === "Enter" || e.key === "Escape") return;
      e.stopPropagation();
      return;
    }

    if (isMaskTab || e.target instanceof HTMLInputElement) return;

    const navigateByArrow: Record<string, (() => void) | undefined> = {
      ArrowLeft: () => handleFrameNavigation("left"),
      ArrowRight: () => handleFrameNavigation("right"),
      ArrowUp: () => handleTrackNavigation("up"),
      ArrowDown: () => handleTrackNavigation("down")
    };

    const navigate = navigateByArrow[e.key];
    if (!navigate) return;

    e.preventDefault();
    e.stopPropagation();
    navigate();
  };

  return (
    <div onKeyDownCapture={handleKeyDownCapture}>
      <GridList
        aria-label="Timeline all tracks"
        selectionMode="none"
        // The input row is `isDisabled` to keep it out of selection/DnD, but the
        // default `disabledBehavior="all"` also makes its children (the "go back
        // to source" button) non-interactive. "selection" scopes the disabled
        // state to selection only, leaving the row's action button clickable.
        disabledBehavior="selection"
        keyboardNavigationBehavior="tab"
        key={`${inputTrackRow.id}-list`}
        className="overflow-x-hidden"
      >
        <GridListItem
          id={inputTrackRow.id}
          textValue={renamingTrackId ? "" : inputTrackRow.name}
          isDisabled
          className="outline-none"
        >
          <InputVideoTrackItem key={inputTrackRow.id} track={inputTrackRow} />
        </GridListItem>
        {visibleTracks.map((track) => (
          <GridListItem
            id={track.id}
            key={track.id}
            textValue={renamingTrackId ? "" : track.name}
            className="outline-none"
          >
            <RenderTrackItem
              key={track.id}
              track={track}
              trackIdWithDoneStatus={trackIdWithDoneStatus}
              setRenamingTrackId={setRenamingTrackId}
            />
          </GridListItem>
        ))}
      </GridList>
    </div>
  );
};
