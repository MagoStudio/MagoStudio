import { afterEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get }
}));
vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => window.mago
}));

import { saveLayerDownloadToDisk } from "./saveLayerDownloadToDisk";

const SIGNED_URL =
  "https://mago-s3-prod.s3.eu-north-1.amazonaws.com/a/exr.zip?X-Amz-Signature=abc";

describe("saveLayerDownloadToDisk", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("hands the presigned URL to the main process to save, never fetching it in the renderer", async () => {
    get.mockResolvedValue({ data: { url: SIGNED_URL } });
    const saveCloudStorageObjectAs = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("mago", { files: { saveCloudStorageObjectAs } });
    const rendererFetch = vi.fn();
    vi.stubGlobal("fetch", rendererFetch);

    const saved = await saveLayerDownloadToDisk({
      layerId: "layer-1",
      kind: "exr",
      suggestedName: "Render_exr.zip"
    });

    expect(saved).toBe(true);
    expect(get).toHaveBeenCalledWith("/download/exr/layer/layer-1");
    expect(saveCloudStorageObjectAs).toHaveBeenCalledWith({
      url: SIGNED_URL,
      suggestedName: "Render_exr.zip"
    });
    expect(rendererFetch).not.toHaveBeenCalled();
  });
});
