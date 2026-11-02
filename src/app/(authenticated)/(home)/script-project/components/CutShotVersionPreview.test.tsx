import { orderCutShotVersionsForDisplay } from "@domains/scriptProject/utils/orderCutShotVersionsForDisplay";
import { CutShot } from "@schemas/scriptProject";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { CutShotVersionPreview } from "./CutShotVersionPreview";

vi.mock("@domains/asset/useCachedVideoPreview", () => ({
  useCachedVideoPreview: () => ({})
}));

const shotWithVersionStatus = (status: string): CutShot => ({
  timeline_id: "timeline",
  shot_index: 0,
  sequence_id: 1,
  heading: null,
  asset_id: "asset",
  pinned_asset_id: null,
  version_name: null,
  is_upscale: false,
  url: null,
  poster_url: null,
  versions: [
    {
      layer_id: "layer",
      asset_id: "asset",
      name: "asset",
      ready: false,
      status,
      url: null,
      poster_url: null,
      upscale_of: null
    }
  ]
});

const withVersionsInDisplayOrder = (shot: CutShot) => ({
  shot,
  versionsInDisplayOrder: orderCutShotVersionsForDisplay(shot, new Map())
});

describe("CutShotVersionPreview", () => {
  it("shows the render error badge instead of the rendering gradient for an errored version", () => {
    const screen = renderWithProviders(
      <CutShotVersionPreview
        {...withVersionsInDisplayOrder(shotWithVersionStatus("error"))}
        outputSize={[1024, 576]}
      />
    );
    expect(screen.getByText("Unknown Error")).toBeInTheDocument();
  });

  it("does not show the render error badge while the version is still rendering", () => {
    const screen = renderWithProviders(
      <CutShotVersionPreview
        {...withVersionsInDisplayOrder(shotWithVersionStatus("inprogress"))}
        outputSize={[1024, 576]}
      />
    );
    expect(screen.queryByText("Unknown Error")).toBeNull();
  });

  it("opens the versions on a click on the video, but not on a click on its play button", () => {
    const onOpenVersions = vi.fn();
    const finishedShot = shotWithVersionStatus("completed");
    const screen = renderWithProviders(
      <CutShotVersionPreview
        {...withVersionsInDisplayOrder({
          ...finishedShot,
          versions: finishedShot.versions.map((version) => ({
            ...version,
            ready: true,
            url: "https://assets.mago.studio/asset.mp4"
          }))
        })}
        outputSize={[1024, 576]}
        onOpenVersions={onOpenVersions}
      />
    );

    fireEvent.click(screen.getByTestId("cut-version-video-asset-play"));
    expect(onOpenVersions).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("cut-version-video-asset"));
    expect(onOpenVersions).toHaveBeenCalledTimes(1);
  });
});
