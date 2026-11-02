import { describe, expect, it, vi } from "vitest";

import { mirrorImageToVideoFrameImages } from "./mirrorImageToVideoFrameImages";

const mirrorToCloudId = (localAssetId: string) =>
  Promise.resolve(`cloud-${localAssetId}`);

describe("mirrorImageToVideoFrameImages", () => {
  it("swaps the start and end image for their cloud ids, start first", async () => {
    const mirrorImage = vi.fn(mirrorToCloudId);

    await expect(
      mirrorImageToVideoFrameImages(
        { image_id: "start", end_image_id: "end", prompt: "a slow pan" },
        mirrorImage
      )
    ).resolves.toEqual({
      image_id: "cloud-start",
      end_image_id: "cloud-end",
      prompt: "a slow pan"
    });
    expect(mirrorImage.mock.calls).toEqual([["start"], ["end"]]);
  });

  it("leaves an absent end image absent", async () => {
    const mirrorImage = vi.fn(mirrorToCloudId);

    const cloudRenderSettings = await mirrorImageToVideoFrameImages(
      { image_id: "start", end_image_id: undefined },
      mirrorImage
    );

    expect(cloudRenderSettings).toEqual({
      image_id: "cloud-start",
      end_image_id: undefined
    });
    expect(mirrorImage).toHaveBeenCalledTimes(1);
  });

  it("does not mutate the local render settings", async () => {
    const localRenderSettings = { image_id: "start" };

    await mirrorImageToVideoFrameImages(localRenderSettings, mirrorToCloudId);

    expect(localRenderSettings).toEqual({ image_id: "start" });
  });
});
