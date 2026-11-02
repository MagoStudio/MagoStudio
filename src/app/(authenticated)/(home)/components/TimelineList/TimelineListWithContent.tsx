/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { Divider } from "@components/Divider";
import { useAspectRatio } from "@context/AspectRatioContext";
import { Shot } from "@schemas/shot";
import { useEffect } from "react";

import { TimelineControls } from "./TimelineControls";
import { TimePanel } from "./TimePanel";
import { TracksList } from "./TracksList";

interface Props {
  currentShot: Shot;
}

export function TimelineListWithContent({ currentShot }: Props) {
  const { updateFromShot } = useAspectRatio();

  useEffect(() => {
    updateFromShot(currentShot);
  }, [currentShot, updateFromShot]);

  return (
    <>
      <div
        className="relative w-full flex items-center justify-between z-50 bg-surface-secondary h-settings-disclosure"
        style={{ minHeight: "var(--height-settings-disclosure)" }}
      >
        <TimelineControls />
      </div>
      <Divider className="z-50" />
      <div className={"relative h-full w-full overflow-hidden"}>
        <div
          className={
            "absolute h-full w-timeline cursor-default pointer-events-none"
          }
        >
          <TimePanel />
        </div>

        <div
          className={
            "w-full relative overflow-y-auto scrollbar-custom top-20 bg-surface-secondary"
          }
          style={{ height: "calc(100% - 5rem)", scrollbarGutter: "stable" }}
        >
          <TracksList />
        </div>
      </div>
    </>
  );
}
