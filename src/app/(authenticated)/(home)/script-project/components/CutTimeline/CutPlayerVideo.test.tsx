import type { CutTimelineClip } from "@domains/scriptProject/utils/buildCutTimelineClips";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  playableVideoUrl: undefined as string | undefined
}));
vi.mock("@domains/asset/useCachedVideoPreview", () => ({
  useCachedVideoPreview: () => ({ playableVideoUrl: mocks.playableVideoUrl })
}));
import { CutPlayerVideo } from "./CutPlayerVideo";

describe("cut playback during synchronization", () => {
  it("waits for the scheduled video before mounting and registering the player", () => {
    mocks.playableVideoUrl = undefined;
    const register = vi.fn();
    const clip: CutTimelineClip = {
      assetId: "cold-video",
      videoUrl: "https://cdn.example/cold.mp4",
      isClipPlayable: true,
      sequenceId: 1,
      timelineId: "shot-1",
      shotIndex: 0,
      heading: null,
      posterUrl: null,
      doesClipHaveRender: true,
      hasClipRenderFailed: false,
      isClipDurationMeasured: false,
      durationFrames: 1,
      startFrame: 0
    };
    const props = {
      clip,
      isActive: true,
      onEnded: vi.fn(),
      onError: vi.fn(),
      registerElement: register
    };
    const { container, rerender } = render(<CutPlayerVideo {...props} />);
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
    mocks.playableVideoUrl = "blob:downloaded-video";
    rerender(<CutPlayerVideo {...props} />);
    expect(container.querySelector("video")?.getAttribute("src")).toBe(
      "blob:downloaded-video"
    );
    expect(register).toHaveBeenCalledWith(container.querySelector("video"));
  });
});
