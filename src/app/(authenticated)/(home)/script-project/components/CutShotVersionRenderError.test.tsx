import { CutShotVersion } from "@schemas/scriptProject";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { CutShotVersionRenderError } from "./CutShotVersionRenderError";

const lookups = vi.hoisted(() => ({
  trackLookup: vi.fn(),
  queueLookup: vi.fn()
}));

vi.mock("@domains/project/useSelectedProjectId", () => ({
  useSelectedProjectId: () => "project-1"
}));
vi.mock("@domains/track/useGetTrackById", () => ({
  useGetTrackById: (options: unknown) => lookups.trackLookup(options)
}));
vi.mock("@domains/queue/useResolvedQueueStatus", () => ({
  useResolvedQueueStatus: (options: unknown) => lookups.queueLookup(options)
}));

const failedVersion: CutShotVersion = {
  layer_id: "layer-1",
  asset_id: "asset-1",
  name: "asset-1",
  ready: false,
  status: "error",
  url: null,
  poster_url: null,
  upscale_of: null
};

const trackWithAssetError = (error: { error: string }) => ({
  clips: [{ asset: { data: { error } } }]
});

describe("CutShotVersionRenderError", () => {
  it("looks the track and queue item up inside the Shot that owns the version", () => {
    lookups.trackLookup.mockReturnValue({ data: undefined });
    lookups.queueLookup.mockReturnValue({ queueItem: undefined });

    renderWithProviders(
      <CutShotVersionRenderError
        shotTimelineId="shot-7"
        version={failedVersion}
      />
    );

    expect(lookups.trackLookup).toHaveBeenCalledWith(
      expect.objectContaining({
        trackId: "layer-1",
        selectedProjectId: "project-1",
        selectedShotId: "shot-7"
      })
    );
    expect(lookups.queueLookup).toHaveBeenCalledWith(
      expect.objectContaining({
        trackId: "layer-1",
        shotIdOverride: "shot-7"
      })
    );
  });

  it("shows the asset's error text in the tooltip", async () => {
    lookups.trackLookup.mockReturnValue({
      data: trackWithAssetError({ error: "Prompt rejected by the model" })
    });
    lookups.queueLookup.mockReturnValue({ queueItem: undefined });

    const screen = renderWithProviders(
      <CutShotVersionRenderError
        shotTimelineId="shot-7"
        version={failedVersion}
      />
    );

    expect(screen.getByText("Error")).toBeInTheDocument();
    fireEvent.mouseEnter(screen.container.querySelector(".h-4.w-4")!);
    expect(
      await screen.findByText("Prompt rejected by the model")
    ).toBeInTheDocument();
  });

  it("falls back to the queue item's error text when the asset has none", async () => {
    lookups.trackLookup.mockReturnValue({ data: undefined });
    lookups.queueLookup.mockReturnValue({
      queueItem: {
        error: { error_type: "x.RenderError", error_message: "Worker crashed" }
      }
    });

    const screen = renderWithProviders(
      <CutShotVersionRenderError
        shotTimelineId="shot-7"
        version={failedVersion}
      />
    );

    fireEvent.mouseEnter(screen.container.querySelector(".h-4.w-4")!);
    expect(await screen.findByText("Worker crashed")).toBeInTheDocument();
  });
});
