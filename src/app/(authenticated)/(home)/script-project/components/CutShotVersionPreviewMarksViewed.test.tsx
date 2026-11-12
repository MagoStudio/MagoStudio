import { orderCutShotVersionsForDisplay } from "@domains/scriptProject/utils/orderCutShotVersionsForDisplay";
import { CutShot } from "@schemas/scriptProject";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ markVersionsViewed: vi.fn() }));

vi.mock("@domains/scriptProject/useViewedShotVersionIds", () => ({
  useViewedShotVersionIds: () => ({
    viewedVersionIds: new Set<string>(),
    markVersionsViewed: mocks.markVersionsViewed
  })
}));

vi.mock("./ShotVideoPreview", () => ({
  ShotVideoPreview: ({
    testId,
    onPlay
  }: {
    testId: string;
    onPlay?: () => void;
  }) => <button type="button" data-testid={testId} onClick={onPlay} />
}));

vi.mock("./RenderMetricsBadge", () => ({
  RenderMetricsBadge: () => null
}));

vi.mock("./ShotVersionDownloadButton", () => ({
  ShotVersionDownloadButton: () => null
}));

import { CutShotVersionPreview } from "./CutShotVersionPreview";

const shot: CutShot = {
  timeline_id: "timeline-1",
  shot_index: 0,
  sequence_id: 1,
  asset_id: "asset-1",
  pinned_asset_id: "asset-1",
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
      poster_url: null
    }
  ]
};

describe("CutShotVersionPreview", () => {
  it("marks the shown version viewed when its main preview plays", () => {
    render(
      <CutShotVersionPreview
        projectId="project-1"
        shot={shot}
        versionsInDisplayOrder={orderCutShotVersionsForDisplay(shot, new Map())}
        outputSize={[1920, 1080]}
        isBusy={false}
        onReuseSettings={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("cut-version-video-asset-1"));

    expect(mocks.markVersionsViewed).toHaveBeenCalledWith(["asset-1"]);
  });
});
