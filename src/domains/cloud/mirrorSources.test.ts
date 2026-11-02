import { describe, expect, it, vi } from "vitest";

import {
  collectSourceImageIds,
  mirrorSourceImages,
  rewriteSourceImageIds
} from "./mirrorSources";

const MAGO_SOURCES = {
  video: "cloud-layer",
  images: [
    { asset_id: "local-ref", type: "reference_frame" },
    { asset_id: "local-key", type: "key_frame", index: 3 }
  ]
};

describe("collectSourceImageIds", () => {
  it("finds the ids in every image slot", () => {
    expect(
      collectSourceImageIds({
        video: "cloud-layer",
        input_mask: "local-mask",
        ipadapter_image_source: "local-ipadapter",
        images: [{ asset_id: "local-ref", type: "reference_frame" }]
      })
    ).toEqual(["local-mask", "local-ipadapter", "local-ref"]);
  });

  it("never treats the video slot as an image", () => {
    // video is a layer the mirror already made, not an asset to upload.
    expect(collectSourceImageIds({ video: "cloud-layer" })).toEqual([]);
  });

  it("lists each id once even when reused across slots", () => {
    expect(
      collectSourceImageIds({
        ipadapter_image_source: "same",
        images: [{ asset_id: "same" }, { asset_id: "same" }]
      })
    ).toEqual(["same"]);
  });

  it("ignores entries with no usable id", () => {
    expect(
      collectSourceImageIds({
        images: [{ asset_id: "" }, { asset_id: 42 }, {}, null as never]
      })
    ).toEqual([]);
  });
});

describe("rewriteSourceImageIds", () => {
  it("swaps local ids for cloud ids and leaves the rest alone", () => {
    const mapping = new Map([
      ["local-ref", "cloud-ref"],
      ["local-key", "cloud-key"]
    ]);

    expect(rewriteSourceImageIds(MAGO_SOURCES, mapping)).toEqual({
      video: "cloud-layer",
      images: [
        { asset_id: "cloud-ref", type: "reference_frame" },
        { asset_id: "cloud-key", type: "key_frame", index: 3 }
      ]
    });
  });

  it("keeps key frame indexes, which order the frames", () => {
    const rewritten = rewriteSourceImageIds(
      MAGO_SOURCES,
      new Map([["local-key", "cloud-key"]])
    );

    expect(rewritten.images?.[1]).toEqual({
      asset_id: "cloud-key",
      type: "key_frame",
      index: 3
    });
  });

  it("swaps the mask and ipadapter slots too", () => {
    const rewritten = rewriteSourceImageIds(
      { input_mask: "local-mask", ipadapter_image_source: "local-ip" },
      new Map([
        ["local-mask", "cloud-mask"],
        ["local-ip", "cloud-ip"]
      ])
    );

    expect(rewritten.input_mask).toBe("cloud-mask");
    expect(rewritten.ipadapter_image_source).toBe("cloud-ip");
  });

  it("leaves an unmapped id untouched rather than dropping it", () => {
    const rewritten = rewriteSourceImageIds(MAGO_SOURCES, new Map());

    expect(rewritten.images?.[0]?.asset_id).toBe("local-ref");
  });

  it("does not mutate the payload it was given", () => {
    const original = structuredClone(MAGO_SOURCES);
    rewriteSourceImageIds(MAGO_SOURCES, new Map([["local-ref", "cloud-ref"]]));

    expect(MAGO_SOURCES).toEqual(original);
  });
});

describe("mirrorSourceImages", () => {
  it("mirrors each image once and returns cloud ids", async () => {
    const mirror = vi.fn(async (id: string) => `cloud-${id}`);

    const result = await mirrorSourceImages(MAGO_SOURCES, mirror);

    expect(mirror).toHaveBeenCalledTimes(2);
    expect(result.images?.map((entry) => entry.asset_id)).toEqual([
      "cloud-local-ref",
      "cloud-local-key"
    ]);
  });

  it("mirrors a reused image only once", async () => {
    const mirror = vi.fn(async (id: string) => `cloud-${id}`);

    await mirrorSourceImages(
      { images: [{ asset_id: "same" }, { asset_id: "same" }] },
      mirror
    );

    expect(mirror).toHaveBeenCalledTimes(1);
  });

  it("does nothing when a render references no images", async () => {
    const mirror = vi.fn();

    const sources = { video: "cloud-layer" };
    expect(await mirrorSourceImages(sources, mirror)).toBe(sources);
    expect(mirror).not.toHaveBeenCalled();
  });

  it("propagates a failure rather than submitting a half-mirrored render", async () => {
    // Submitting with one id still local would fail obscurely in the backend.
    const mirror = vi.fn(async (id: string) => {
      if (id === "local-key") throw new Error("upload failed");
      return `cloud-${id}`;
    });

    await expect(mirrorSourceImages(MAGO_SOURCES, mirror)).rejects.toThrow(
      /upload failed/
    );
  });
});
