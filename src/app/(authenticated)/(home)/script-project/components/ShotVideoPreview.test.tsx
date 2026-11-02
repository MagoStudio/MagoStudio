import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cachedPreview: vi.fn(
    (): {
      videoFirstFrameUrl: string | undefined;
      playableVideoUrl: string | undefined;
      isLoading?: boolean;
      isVideoAvailable?: boolean;
    } => ({
      videoFirstFrameUrl: undefined,
      playableVideoUrl: undefined
    })
  ),
  isIntersecting: false,
  downloadState: undefined as "queued" | "downloading" | undefined
}));

vi.mock("@domains/asset/useAssetDownloadPriority", () => ({
  useAssetDownloadPriority: () => {},
  useAssetDownloadState: () => mocks.downloadState
}));

vi.mock("@domains/asset/useCachedVideoPreview", () => ({
  useCachedVideoPreview: mocks.cachedPreview
}));

vi.mock("usehooks-ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("usehooks-ts")>()),
  useIntersectionObserver: () => ({
    ref: vi.fn(),
    isIntersecting: mocks.isIntersecting,
    entry: undefined
  })
}));

import { ShotVideoPreview } from "./ShotVideoPreview";

describe("ShotVideoPreview", () => {
  beforeEach(() => {
    mocks.cachedPreview.mockReset().mockReturnValue({
      videoFirstFrameUrl: undefined,
      playableVideoUrl: undefined
    });
    mocks.isIntersecting = false;
    mocks.downloadState = undefined;
  });

  it.each([
    "mago-media://script-project/video-1",
    "https://cdn.example/video.mp4"
  ])(
    "does not cover an available video with a background sync spinner (%s)",
    (videoUrl) => {
      mocks.isIntersecting = true;
      mocks.downloadState = "queued";
      mocks.cachedPreview.mockReturnValue({
        videoFirstFrameUrl: "blob:first-frame",
        playableVideoUrl: undefined,
        isVideoAvailable: true,
        isLoading: false
      });
      render(
        <ShotVideoPreview
          assetId="asset-1"
          videoUrl={videoUrl}
          hasRender
          outputSize={[1920, 1080]}
          testId="available-preview"
        />
      );
      expect(screen.queryByRole("progressbar")).toBeNull();
      expect(screen.getByTestId("available-preview-play")).toBeEnabled();
    }
  );

  it("keeps the download spinner for a remote video whose bytes are not available", () => {
    mocks.isIntersecting = true;
    mocks.downloadState = "queued";
    mocks.cachedPreview.mockReturnValue({
      videoFirstFrameUrl: undefined,
      playableVideoUrl: undefined,
      isVideoAvailable: false,
      isLoading: true
    });
    render(
      <ShotVideoPreview
        assetId="asset-1"
        videoUrl="https://cdn.example/video.mp4"
        posterUrl="https://cdn.example/poster.jpg"
        hasRender
        outputSize={[1920, 1080]}
        testId="pending-preview"
      />
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByTestId("pending-preview-play")).toBeNull();
  });

  it("does not attach off-screen video or poster assets", () => {
    const { container } = render(
      <ShotVideoPreview
        assetId="asset-1"
        videoUrl="mago-media://script-project/video-1"
        posterUrl="mago-media://script-project/poster-1"
        hasRender
        outputSize={[1920, 1080]}
      />
    );

    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(mocks.cachedPreview).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false, loadVideo: false })
    );
  });

  it("shows the poster while the full-resolution first frame resolves", () => {
    mocks.isIntersecting = true;

    const { container } = render(
      <ShotVideoPreview
        assetId="asset-1"
        videoUrl="mago-media://script-project/video-1"
        posterUrl="mago-media://script-project/poster-1"
        hasRender
        outputSize={[1920, 1080]}
      />
    );

    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "mago-media://script-project/poster-1"
    );
    expect(mocks.cachedPreview).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, loadVideo: false })
    );
  });

  it("prefers the full-resolution first frame over a low-resolution poster", () => {
    mocks.isIntersecting = true;
    mocks.cachedPreview.mockReturnValue({
      videoFirstFrameUrl: "blob:first-frame",
      playableVideoUrl: undefined
    });

    const { container } = render(
      <ShotVideoPreview
        assetId="asset-1"
        videoUrl="mago-media://script-project/video-1"
        posterUrl="https://cdn.example/poster-thumbnail.jpg"
        hasRender
        outputSize={[1920, 1080]}
      />
    );

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "blob:first-frame"
    );
  });

  it("reports the version as viewed only once the video plays", () => {
    mocks.isIntersecting = true;
    mocks.cachedPreview.mockReturnValue({
      videoFirstFrameUrl: "blob:first-frame",
      playableVideoUrl: undefined
    });
    const onPlay = vi.fn();

    render(
      <ShotVideoPreview
        assetId="asset-1"
        videoUrl="mago-media://script-project/video-1"
        hasRender
        outputSize={[1920, 1080]}
        testId="shot-preview"
        onPlay={onPlay}
      />
    );

    fireEvent.click(screen.getByTestId("shot-preview-play"));

    expect(onPlay).not.toHaveBeenCalled();

    const video = screen.getByTestId("shot-preview").querySelector("video");
    expect(video).not.toBeNull();
    fireEvent.play(video!);

    expect(onPlay).toHaveBeenCalledOnce();
  });
});
