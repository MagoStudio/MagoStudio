import { renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ selectedAssetId: "syncing" }));
vi.mock("@domains/track/useSelectedTracks", () => ({
  useSelectedTracks: () => ({
    data: [{ clips: [{ asset_id: mocks.selectedAssetId }] }]
  })
}));
vi.mock("@domains/asset/mediaDownloads", () => ({
  mediaDownloads: {
    subscribe: () => () => {},
    getAssetState: (assetId: string) =>
      assetId === "syncing" ? "downloading" : "ready"
  }
}));

import { useDisablePlayButton } from "./useDisablePlayButton";

it("tracks downloads only for the selected track", () => {
  const { result, rerender } = renderHook(useDisablePlayButton);
  expect(result.current.isDownloading).toBe(true);
  expect(result.current.disablePlayButton).toBe(true);

  mocks.selectedAssetId = "ready";
  rerender();
  expect(result.current.isDownloading).toBe(false);
});
