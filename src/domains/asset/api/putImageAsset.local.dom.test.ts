import { afterEach, describe, expect, it, vi } from "vitest";

const { put } = vi.hoisted(() => ({ put: vi.fn() }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { put }
}));
vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => window.mago
}));

import { putImageAsset } from "./putImageAsset";

const libraryAsset = (data: Record<string, unknown>) => ({
  id: "asset-1",
  name: "Still",
  filepath: "mago-media://asset/asset-1",
  data
});

const stubDesktop = (asset: ReturnType<typeof libraryAsset> | null) => {
  const assets = {
    get: vi.fn().mockResolvedValue(asset),
    update: vi.fn().mockResolvedValue(asset)
  };
  vi.stubGlobal("mago", { assets });
  return assets;
};

describe("putImageAsset in the desktop app", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("rates a local asset in the library", async () => {
    const assets = stubDesktop(
      libraryAsset({ thumbnail_filepath: "mago-media://thumbnail/asset-1" })
    );

    const response = await putImageAsset("asset-1", { rate: 2 });

    expect(assets.update).toHaveBeenCalledWith({ assetId: "asset-1", rate: 2 });
    expect(put).not.toHaveBeenCalled();
    expect(response.urlToUse).toBe("mago-media://thumbnail/asset-1");
  });

  it("rates a mirrored cloud asset in the cloud and keeps the mirror in step", async () => {
    const assets = stubDesktop(libraryAsset({ cloudMirror: true }));
    put.mockResolvedValue({ data: { s3_url: "https://cloud/asset-1" } });

    const response = await putImageAsset("asset-1", { rate: 2 });

    expect(put).toHaveBeenCalledWith("/assets/asset-1", { rate: 2 });
    expect(assets.update).toHaveBeenCalledWith({ assetId: "asset-1", rate: 2 });
    expect(response).toEqual({ s3_url: "https://cloud/asset-1" });
  });

  it("rates a cloud asset that was never mirrored in the cloud", async () => {
    const assets = stubDesktop(null);
    put.mockResolvedValue({ data: { s3_url: "https://cloud/asset-1" } });

    await expect(putImageAsset("asset-1", { rate: 0 })).resolves.toEqual({
      s3_url: "https://cloud/asset-1"
    });
    expect(assets.update).not.toHaveBeenCalled();
  });
});
