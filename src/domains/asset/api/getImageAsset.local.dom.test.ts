import { afterEach, describe, expect, it, vi } from "vitest";

import { getImageAsset } from "./getImageAsset.local";

describe("getImageAsset (desktop)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the original local image instead of its low-resolution thumbnail", async () => {
    const get = vi.fn().mockResolvedValue({
      id: "image-1",
      name: "render.png",
      filepath: "mago-media://asset/image-1",
      data: { thumbnail_filepath: "mago-media://thumbnail/image-1" }
    });
    vi.stubGlobal("mago", { assets: { get } });

    const result = await getImageAsset("image-1");

    expect(get).toHaveBeenCalledWith("image-1");
    expect(result.urlToUse).toBe("mago-media://asset/image-1");
    expect(result.s3_url).toBe("mago-media://asset/image-1");
  });
  it("withholds placeholder URLs until a mirrored image arrives", async () => {
    vi.stubGlobal("mago", {
      assets: {
        get: vi.fn().mockResolvedValue({
          id: "pending",
          filepath: "mago-media://asset/pending",
          data: { cloudMirror: true, status: "created" }
        })
      }
    });
    expect(await getImageAsset("pending")).toMatchObject({
      urlToUse: "",
      s3_url: ""
    });
  });
});
