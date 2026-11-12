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
  it("shows the version's settings, not the sent prompt, to every user", async () => {
    const shot = shotWithVersionStatus("completed");
    const screen = renderWithProviders(
      <CutShotVersionPreview
        {...withVersionsInDisplayOrder({
          ...shot,
          versions: [
            {
              ...shot.versions[0]!,
              sent_prompt: "Composed prompt for the model",
              render_spec: {
                kind: "shot",
                video_prompt: "Follow the lone astronaut"
              }
            }
          ]
        })}
        outputSize={[1024, 576]}
        isBusy={false}
        onReuseSettings={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("cut-version-settings-button-asset"));
    expect(await screen.findByText("Follow the lone astronaut")).toBeVisible();
    expect(screen.queryByText("Composed prompt for the model")).toBeNull();
  });
  it("shows the render error badge instead of the rendering gradient for an errored version", () => {
    const screen = renderWithProviders(
      <CutShotVersionPreview
        {...withVersionsInDisplayOrder(shotWithVersionStatus("error"))}
        outputSize={[1024, 576]}
        isBusy={false}
        onReuseSettings={vi.fn()}
      />
    );
    expect(screen.getByText("Unknown Error")).toBeInTheDocument();
  });

  it("does not show the render error badge while the version is still rendering", () => {
    const screen = renderWithProviders(
      <CutShotVersionPreview
        {...withVersionsInDisplayOrder(shotWithVersionStatus("inprogress"))}
        outputSize={[1024, 576]}
        isBusy={false}
        onReuseSettings={vi.fn()}
      />
    );
    expect(screen.queryByText("Unknown Error")).toBeNull();
  });

  it("names the version it shows, numbered like the versions below it", () => {
    const shot = shotWithVersionStatus("completed");
    const screen = renderWithProviders(
      <CutShotVersionPreview
        {...withVersionsInDisplayOrder({
          ...shot,
          versions: [
            {
              ...shot.versions[0]!,
              asset_id: "newest",
              created_at: "2026-10-02T12:00:00Z",
              ready: true
            },
            {
              ...shot.versions[0]!,
              asset_id: "oldest",
              created_at: "2026-10-01T12:00:00Z",
              ready: true
            }
          ],
          pinned_asset_id: "oldest"
        })}
        outputSize={[1024, 576]}
        isBusy={false}
        onReuseSettings={vi.fn()}
      />
    );

    expect(screen.getByTestId("cut-version-name-oldest")).toHaveTextContent(
      "Version 1"
    );
  });
});
