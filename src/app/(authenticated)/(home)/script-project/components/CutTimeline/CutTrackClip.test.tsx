import { CutTimelineClip } from "@domains/scriptProject/utils/buildCutTimelineClips";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { CutTrackClip } from "./CutTrackClip";

const useMediaBunnyFilmstrip = vi.fn();

vi.mock("@hooks/preview/useMediaBunnyFilmstrip", () => ({
  useMediaBunnyFilmstrip: (props: unknown) => useMediaBunnyFilmstrip(props)
}));

const clip: CutTimelineClip = {
  timelineId: "shot",
  sequenceId: 1,
  shotIndex: 0,
  heading: "Opening",
  posterUrl: "https://s3/poster.jpg",
  videoUrl: "https://s3/render.mp4",
  assetId: "asset",
  isClipPlayable: true,
  doesClipHaveRender: true,
  hasClipRenderFailed: false,
  isClipDurationMeasured: true,
  durationFrames: 120,
  startFrame: 0
};

const renderClip = (overrides: Partial<CutTimelineClip> = {}) =>
  renderWithProviders(
    <CutTrackClip
      clip={{ ...clip, ...overrides }}
      widthPercent={50}
      isActive={false}
      onDownload={vi.fn()}
    />
  );

describe("cut track clip filmstrip", () => {
  beforeEach(() => useMediaBunnyFilmstrip.mockReset());

  it("generates the filmstrip from the shot's own video url", () => {
    useMediaBunnyFilmstrip.mockReturnValue({ data: "data:filmstrip" });

    const screen = renderClip();

    expect(useMediaBunnyFilmstrip).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: "asset",
        videoUrl: "https://s3/render.mp4",
        width: 800,
        enabled: true
      })
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", "data:filmstrip");
  });

  it("shows the poster until a filmstrip exists", () => {
    useMediaBunnyFilmstrip.mockReturnValue({ data: undefined });

    const screen = renderClip();

    expect(screen.getByRole("img").style.backgroundImage).toContain(
      "poster.jpg"
    );
  });

  it("does not generate a filmstrip for a shot with no render to play", () => {
    useMediaBunnyFilmstrip.mockReturnValue({ data: undefined });

    renderClip({ videoUrl: null, posterUrl: null });

    expect(useMediaBunnyFilmstrip).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });
});
