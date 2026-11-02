import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@context/AspectRatioContext", () => ({
  useAspectRatio: () => ({ aspectRatio: [16, 9] })
}));
vi.mock("@domains/asset/useVideoFrame", () => ({
  useVideoFrame: () => ({ data: "data:image/jpeg;base64,frame" })
}));
vi.mock("@domains/track/useSelectedTrackIds", () => ({
  useSelectedTrackIds: () => []
}));
vi.mock("@domains/track/utils/getTrackAssetData", () => ({
  getTrackAssetData: () => ({ fps: 24 })
}));
vi.mock("@domains/track/utils/getTrackAssetId", () => ({
  getTrackAssetId: () => "asset-1"
}));

import { ThumbnailPreview } from ".";

describe("ThumbnailPreview", () => {
  it("fills the preview box instead of exposing its black background", () => {
    const { container } = render(
      <ThumbnailPreview layer={{ id: "track-1" } as never} />
    );

    expect(container.querySelector("img")).toHaveClass(
      "h-full",
      "w-full",
      "object-cover"
    );
  });
});
