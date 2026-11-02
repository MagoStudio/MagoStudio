import type { CutTimelineClip } from "@domains/scriptProject/utils/buildCutTimelineClips";
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("@domains/asset/useAssetDownloadPriority", () => ({
  useAssetDownloadState: (assetId: string) =>
    assetId === "syncing" ? "downloading" : "ready"
}));
vi.mock("@domains/asset/useCachedVideoPreview", () => ({
  useCachedVideoPreview: ({ assetId }: { assetId: string }) => ({
    playableVideoUrl: assetId === "syncing" ? undefined : "blob:ready"
  })
}));

import { CutPlayer } from "./CutPlayer";

it("replaces play only while the current clip is syncing", () => {
  const clip: CutTimelineClip = {
    assetId: "syncing",
    videoUrl: "https://example.com/video.mp4",
    isClipPlayable: true,
    sequenceId: 1,
    timelineId: "shot-1",
    shotIndex: 0,
    heading: null,
    posterUrl: null,
    doesClipHaveRender: true,
    hasClipRenderFailed: false,
    isClipDurationMeasured: true,
    durationFrames: 24,
    startFrame: 0
  };
  const props = {
    clips: [
      clip,
      { ...clip, assetId: "ready", timelineId: "shot-2", sequenceId: 2 }
    ],
    outputSize: [1920, 1080] as [number, number],
    isCutPlaying: false,
    canCutPlay: true,
    onTogglePlayback: vi.fn(),
    onClipEnded: vi.fn(),
    onClipError: vi.fn(),
    registerClipVideoElement: vi.fn()
  };
  const { rerender } = render(<CutPlayer {...props} activeClipIndex={0} />);
  expect(screen.queryByTestId("cut-player-overlay-play")).toBeNull();
  expect(screen.getAllByRole("progressbar")).toHaveLength(1);

  rerender(<CutPlayer {...props} activeClipIndex={1} />);
  expect(screen.getByTestId("cut-player-overlay-play")).toBeInTheDocument();
  expect(screen.queryByRole("progressbar")).toBeNull();
});
