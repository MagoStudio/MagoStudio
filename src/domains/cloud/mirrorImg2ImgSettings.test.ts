import { describe, expect, it, vi } from "vitest";

import {
  collectSettingsImageIds,
  mirrorImg2ImgSettings,
  rewriteSettingsImageIds
} from "./mirrorImg2ImgSettings";

describe("collectSettingsImageIds", () => {
  it("finds the input image and every reference image", () => {
    expect(
      collectSettingsImageIds({
        input_image_id: "local-input",
        reference_images: ["local-a", "local-b"]
      })
    ).toEqual(["local-input", "local-a", "local-b"]);
  });

  it("finds an uploaded mask image", () => {
    expect(
      collectSettingsImageIds({
        input_image_id: "local-input",
        mask_image_id: "local-mask"
      })
    ).toEqual(["local-input", "local-mask"]);
  });

  it("ignores an inline input image, which is a data URL and not an id", () => {
    expect(
      collectSettingsImageIds({
        input_image: "data:image/png;base64,AAAA",
        reference_images: []
      })
    ).toEqual([]);
  });

  it("reports each id once, however many slots reference it", () => {
    expect(
      collectSettingsImageIds({
        input_image_id: "shared",
        reference_images: ["shared", "other"]
      })
    ).toEqual(["shared", "other"]);
  });

  it("copes with the slots being absent or the wrong shape", () => {
    expect(collectSettingsImageIds({})).toEqual([]);
    expect(
      collectSettingsImageIds({ reference_images: "not-an-array" })
    ).toEqual([]);
  });
});

describe("rewriteSettingsImageIds", () => {
  it("swaps local ids for cloud ones and leaves everything else alone", () => {
    const mapping = new Map([
      ["local-input", "cloud-input"],
      ["local-a", "cloud-a"]
    ]);
    expect(
      rewriteSettingsImageIds(
        {
          input_image_id: "local-input",
          reference_images: ["local-a"],
          prompt: "keep me",
          width: 1024
        },
        mapping
      )
    ).toEqual({
      input_image_id: "cloud-input",
      reference_images: ["cloud-a"],
      prompt: "keep me",
      width: 1024
    });
  });

  it("swaps an uploaded mask image for its cloud id", () => {
    expect(
      rewriteSettingsImageIds(
        { mask_image_id: "local-mask", quality: "high" },
        new Map([["local-mask", "cloud-mask"]])
      )
    ).toEqual({ mask_image_id: "cloud-mask", quality: "high" });
  });

  it("leaves an unmapped id untouched rather than dropping it", () => {
    expect(
      rewriteSettingsImageIds({ reference_images: ["unmapped"] }, new Map())
    ).toEqual({ reference_images: ["unmapped"] });
  });

  it("does not mutate the settings it was given", () => {
    const settings = { input_image_id: "local", reference_images: ["local-a"] };
    rewriteSettingsImageIds(
      settings,
      new Map([
        ["local", "cloud"],
        ["local-a", "cloud-a"]
      ])
    );
    expect(settings).toEqual({
      input_image_id: "local",
      reference_images: ["local-a"]
    });
  });
});

describe("mirrorImg2ImgSettings", () => {
  it("mirrors every referenced image exactly once and returns cloud ids", async () => {
    const mirror = vi.fn(async (id: string) => `cloud-${id}`);
    const result = await mirrorImg2ImgSettings(
      { input_image_id: "a", reference_images: ["b", "a"] },
      mirror
    );

    expect(result).toEqual({
      input_image_id: "cloud-a",
      reference_images: ["cloud-b", "cloud-a"]
    });
    // "a" appears in both slots but is only uploaded once.
    expect(mirror).toHaveBeenCalledTimes(2);
  });

  it("uploads nothing when there is no image to mirror", async () => {
    const mirror = vi.fn();
    const settings = { input_image: "data:image/png;base64,AAAA" };
    await expect(mirrorImg2ImgSettings(settings, mirror)).resolves.toBe(
      settings
    );
    expect(mirror).not.toHaveBeenCalled();
  });

  it("propagates a failed upload rather than submitting a local id", async () => {
    await expect(
      mirrorImg2ImgSettings({ input_image_id: "a" }, async () => {
        throw new Error("upload failed");
      })
    ).rejects.toThrow("upload failed");
  });
});
