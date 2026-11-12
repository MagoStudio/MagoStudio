import { orderCutShotVersionsForDisplay } from "@domains/scriptProject/utils/orderCutShotVersionsForDisplay";
import { CutShot } from "@schemas/scriptProject";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setVersionRating: vi.fn(),
  setVersionComment: vi.fn(),
  markVersionsViewed: vi.fn()
}));

vi.mock("@components/OverlayDialog", () => ({
  OverlayDialog: ({
    children,
    isOpen
  }: {
    children: React.ReactNode;
    isOpen: boolean;
  }) => (isOpen ? <div>{children}</div> : null)
}));

vi.mock("@domains/asset/useCachedVideoPreview", () => ({
  useCachedVideoPreview: ({ assetId }: { assetId: string }) => ({
    videoFirstFrameUrl: undefined,
    playableVideoUrl: `blob:${assetId}`
  })
}));

vi.mock("@domains/scriptProject/useShotVersionRatings", () => ({
  useShotVersionRatings: () => ({
    ratingsByAssetId: {},
    setVersionRating: mocks.setVersionRating
  })
}));

vi.mock("@domains/scriptProject/useShotVersionComments", () => ({
  useShotVersionComments: () => ({
    commentsByAssetId: {},
    setVersionComment: mocks.setVersionComment
  })
}));

vi.mock("@domains/scriptProject/useViewedShotVersionIds", () => ({
  useViewedShotVersionIds: () => ({
    viewedVersionIds: new Set<string>(),
    markVersionsViewed: mocks.markVersionsViewed
  })
}));

vi.mock("@domains/scriptProject/useRenderMetrics", () => ({
  useRenderMetrics: () => ({ data: undefined })
}));

vi.mock("./RenderMetricsBadge", () => ({
  RenderMetricsBadge: () => null
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "script_project.compare_versions_timeline.label":
          "Version comparison timeline",
        "script_project.play_all_versions_button.label": "Play all versions",
        "script_project.pause_all_versions_button.label": "Pause all versions"
      })[key] ?? key
  })
}));

import { CutShotVersionDialog } from "./CutShotVersionDialog";

const shot: CutShot = {
  timeline_id: "timeline-1",
  shot_index: 0,
  sequence_id: 1,
  heading: "Opening shot",
  asset_id: "asset-1",
  pinned_asset_id: null,
  version_name: null,
  is_upscale: false,
  url: "https://example.com/asset-1.mp4",
  poster_url: null,
  versions: [
    {
      layer_id: "layer-1",
      asset_id: "asset-1",
      ready: true,
      status: "success",
      url: "https://example.com/asset-1.mp4",
      poster_url: null,
      render_spec: { model: "minimax-h3" }
    },
    {
      layer_id: "layer-2",
      asset_id: "asset-2",
      ready: true,
      status: "success",
      url: "https://example.com/asset-2.mp4",
      poster_url: null
    }
  ]
};

describe("CutShotVersionDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  });

  it("seeks and plays every version from one shared timeline", () => {
    render(
      <CutShotVersionDialog
        projectId="project-1"
        shot={shot}
        outputSize={[1920, 1080]}
        versionsInDisplayOrder={orderCutShotVersionsForDisplay(shot, new Map())}
        shownVersionAssetId="asset-1"
        isOpen
        isBusy={false}
        onOpenChange={vi.fn()}
        onPin={vi.fn()}
        onReuseSettings={vi.fn()}
      />
    );

    const videos = screen.getAllByTestId(/cut-version-option-video-/);
    expect(videos).toHaveLength(2);
    videos.forEach((video, index) => {
      Object.defineProperty(video, "duration", {
        configurable: true,
        value: index === 0 ? 4 : 6
      });
      fireEvent.loadedMetadata(video);
    });

    fireEvent.change(
      screen.getByRole("slider", { name: "Version comparison timeline" }),
      { target: { value: "2" } }
    );

    expect((videos[0] as HTMLVideoElement).currentTime).toBe(2);
    expect((videos[1] as HTMLVideoElement).currentTime).toBe(2);

    fireEvent.click(screen.getByRole("button", { name: "Play all versions" }));

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByTestId("cut-version-option-asset-2"));
    expect(mocks.markVersionsViewed).not.toHaveBeenCalled();

    fireEvent.play(screen.getByTestId("cut-version-option-video-asset-2"));
    expect(mocks.markVersionsViewed).toHaveBeenCalledWith(["asset-2"]);
  });
});
