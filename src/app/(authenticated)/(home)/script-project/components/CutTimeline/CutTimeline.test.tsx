import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@hooks/preview/useMediaBunnyFilmstrip", () => ({
  useMediaBunnyFilmstrip: () => ({ data: undefined })
}));

import { CutTimeline } from "./CutTimeline";

const clip = {
  timelineId: "timeline-1",
  sequenceId: 1,
  shotIndex: 0,
  heading: "Opening shot",
  posterUrl: "mago-media://script-project/poster-1",
  videoUrl: "mago-media://script-project/video-1",
  assetId: "video-1",
  isClipPlayable: true,
  doesClipHaveRender: true,
  hasClipRenderFailed: false,
  isClipDurationMeasured: true,
  durationFrames: 96,
  startFrame: 0
};

describe("CutTimeline", () => {
  it("scrubs continuously while the pointer is dragged", () => {
    const onSeekToPercent = vi.fn();
    render(
      <CutTimeline
        clips={[clip]}
        totalDurationFrames={96}
        activeClipIndex={0}
        isCutPlaying={false}
        isEveryDurationSettled
        playheadRef={createRef<HTMLDivElement>()}
        onSeekToPercent={onSeekToPercent}
        onDownloadClip={vi.fn()}
      />
    );

    const timeline = screen.getByTestId("script-project-cut-timeline");
    const trackArea = timeline.lastElementChild as HTMLDivElement;
    trackArea.getBoundingClientRect = vi.fn(() => ({
      bottom: 100,
      height: 100,
      left: 100,
      right: 300,
      top: 0,
      width: 200,
      x: 100,
      y: 0,
      toJSON: vi.fn()
    }));

    fireEvent.pointerDown(trackArea, { button: 0, clientX: 120, pointerId: 1 });
    fireEvent.pointerMove(trackArea, { clientX: 220, pointerId: 1 });
    fireEvent.pointerUp(trackArea, { clientX: 280, pointerId: 1 });
    fireEvent.pointerMove(trackArea, { clientX: 140, pointerId: 1 });

    expect(onSeekToPercent.mock.calls).toEqual([[10], [60], [90]]);
  });
});
