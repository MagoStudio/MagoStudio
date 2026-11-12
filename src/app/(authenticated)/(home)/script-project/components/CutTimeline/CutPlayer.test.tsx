import { CutTimelineClip } from "@domains/scriptProject/utils/buildCutTimelineClips";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { CutPlayer } from "./CutPlayer";

vi.mock("@domains/asset/useAssetDownloadPriority", () => ({
  useAssetDownloadState: (assetId: string) =>
    assetId === "syncing" ? "downloading" : "ready"
}));
vi.mock("@domains/asset/useCachedVideoPreview", () => ({
  useCachedVideoPreview: ({
    assetId,
    videoUrl
  }: {
    assetId: string;
    videoUrl: string | null;
  }) => ({
    playableVideoUrl: assetId === "syncing" ? undefined : videoUrl
  })
}));

const buildClip = (
  overrides: Partial<CutTimelineClip> & Pick<CutTimelineClip, "sequenceId">
): CutTimelineClip => ({
  timelineId: `shot-${overrides.sequenceId}`,
  shotIndex: 0,
  heading: null,
  posterUrl: null,
  videoUrl: `https://cdn.example.com/${overrides.sequenceId}.mp4`,
  assetId: `asset-${overrides.sequenceId}`,
  versionAssetId: `version-${overrides.sequenceId}`,
  isClipPlayable: true,
  doesClipHaveRender: true,
  isClipRendering: false,
  hasClipRenderFailed: false,
  isClipDurationMeasured: true,
  durationFrames: 24,
  startFrame: 0,
  ...overrides
});

const renderCutPlayer = (
  clips: CutTimelineClip[],
  onClipPlay: (playedVersionAssetId: string | null) => void,
  { isCutPlaying = true }: { isCutPlaying?: boolean } = {}
) => (
  <CutPlayer
    clips={clips}
    activeClipIndex={1}
    outputSize={[1024, 576]}
    isCutPlaying={isCutPlaying}
    canCutPlay
    onTogglePlayback={vi.fn()}
    onClipPlay={onClipPlay}
    onClipEnded={vi.fn()}
    onClipError={vi.fn()}
    registerClipVideoElement={vi.fn()}
  />
);

describe("cut player", () => {
  it("reports the version of the clip whose video starts playing, not the file it plays", () => {
    const onClipPlay = vi.fn();
    const screen = renderWithProviders(
      renderCutPlayer(
        [
          buildClip({ sequenceId: 1 }),
          buildClip({ sequenceId: 2, startFrame: 24 })
        ],
        onClipPlay
      )
    );
    fireEvent.play(screen.getByTestId("cut-player-video-2"));
    expect(onClipPlay).toHaveBeenCalledExactlyOnceWith("version-2");
  });
  it("keeps the playing clip on the take it mounted with when the scene's take changes", () => {
    const onClipPlay = vi.fn();
    const firstClip = buildClip({ sequenceId: 1 });
    const screen = renderWithProviders(
      renderCutPlayer(
        [firstClip, buildClip({ sequenceId: 2, startFrame: 24 })],
        onClipPlay
      )
    );
    screen.rerender(
      renderCutPlayer(
        [
          firstClip,
          buildClip({
            sequenceId: 2,
            startFrame: 24,
            assetId: "asset-2-newer-version",
            versionAssetId: "version-2-newer",
            videoUrl: "https://cdn.example.com/2-newer-version.mp4"
          })
        ],
        onClipPlay
      )
    );
    const video = screen.getByTestId("cut-player-video-2");
    fireEvent.play(video);
    expect(video).toHaveAttribute("src", "https://cdn.example.com/2.mp4");
    expect(onClipPlay).toHaveBeenCalledExactlyOnceWith("version-2");
  });

  it("moves a clip that is not playing onto the scene's new take", () => {
    const clipsWithNextTake = (assetId: string) => [
      buildClip({ sequenceId: 1 }),
      buildClip({ sequenceId: 2, startFrame: 24 }),
      buildClip({
        sequenceId: 3,
        startFrame: 48,
        assetId,
        videoUrl: `https://cdn.example.com/${assetId}.mp4`
      })
    ];
    const screen = renderWithProviders(
      renderCutPlayer(clipsWithNextTake("raw-take"), vi.fn())
    );
    screen.rerender(renderCutPlayer(clipsWithNextTake("dubbed-take"), vi.fn()));
    expect(screen.getByTestId("cut-player-video-3")).toHaveAttribute(
      "src",
      "https://cdn.example.com/dubbed-take.mp4"
    );
  });

  it("reloads the scene's new take on the current clip while the cut is paused", () => {
    const onClipPlay = vi.fn();
    const firstClip = buildClip({ sequenceId: 1 });
    const screen = renderWithProviders(
      renderCutPlayer(
        [firstClip, buildClip({ sequenceId: 2, startFrame: 24 })],
        onClipPlay,
        { isCutPlaying: false }
      )
    );
    screen.rerender(
      renderCutPlayer(
        [
          firstClip,
          buildClip({
            sequenceId: 2,
            startFrame: 24,
            assetId: "asset-2-newer-version",
            versionAssetId: "version-2-newer",
            videoUrl: "https://cdn.example.com/2-newer-version.mp4"
          })
        ],
        onClipPlay,
        { isCutPlaying: false }
      )
    );
    const video = screen.getByTestId("cut-player-video-2");
    fireEvent.play(video);
    expect(video).toHaveAttribute(
      "src",
      "https://cdn.example.com/2-newer-version.mp4"
    );
    expect(onClipPlay).toHaveBeenCalledExactlyOnceWith("version-2-newer");
  });
});

describe("cut player while a clip's cached copy syncs", () => {
  it("replaces play only while the current clip is syncing", () => {
    const clips = [
      buildClip({ sequenceId: 1, assetId: "syncing" }),
      buildClip({ sequenceId: 2, assetId: "ready" })
    ];
    const props = {
      clips,
      outputSize: [1920, 1080] as [number, number],
      isCutPlaying: false,
      canCutPlay: true,
      onTogglePlayback: vi.fn(),
      onClipPlay: vi.fn(),
      onClipEnded: vi.fn(),
      onClipError: vi.fn(),
      registerClipVideoElement: vi.fn()
    };
    const screen = renderWithProviders(
      <CutPlayer {...props} activeClipIndex={0} />
    );
    expect(screen.queryByTestId("cut-player-overlay-play")).toBeNull();
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);

    screen.rerender(<CutPlayer {...props} activeClipIndex={1} />);
    expect(screen.getByTestId("cut-player-overlay-play")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
