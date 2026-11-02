import { describe, expect, test } from "vitest";

import { toCloudRenderOutputLinkData } from "./toCloudRenderOutputLinkData";

describe("toCloudRenderOutputLinkData", () => {
  test("links a video output to the cloud layer that holds it, so it can be rendered from", () => {
    expect(
      toCloudRenderOutputLinkData({
        cloudOutputLayerId: "cloud-output-layer",
        isImage: false
      })
    ).toEqual({
      origin: "cloud",
      status: "ingested",
      cloudLayerId: "cloud-output-layer"
    });
  });

  test("marks an image output as an image", () => {
    expect(
      toCloudRenderOutputLinkData({ cloudOutputLayerId: null, isImage: true })
    ).toEqual({ origin: "cloud", status: "ingested", kind: "image" });
  });
});
