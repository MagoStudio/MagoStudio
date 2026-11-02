import { afterEach, describe, expect, it, vi } from "vitest";

const { post, ensureCloudImageAsset } = vi.hoisted(() => ({
  post: vi.fn(),
  ensureCloudImageAsset: vi.fn()
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { post, get: vi.fn() }
}));
vi.mock("@domains/cloud/mirrorService", () => ({ ensureCloudImageAsset }));

import { postSheetGroupImage } from "./postSheetGroupImage.local";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("postSheetGroupImage (desktop)", () => {
  it("files a cloud project's uploaded entity image under its cloud asset id", async () => {
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      projects: { get: vi.fn().mockResolvedValue({ origin: "cloud" }) }
    });
    ensureCloudImageAsset.mockResolvedValue("cloud-asset-1");
    post.mockResolvedValue({
      data: { token: "baker", name: "Baker", layer_id: "layer-1", images: [] }
    });

    await postSheetGroupImage({
      projectId: "project-1",
      timelineId: "sheets-1",
      token: "baker",
      assetId: "local-asset-1"
    });

    expect(ensureCloudImageAsset).toHaveBeenCalledWith(
      expect.anything(),
      "local-asset-1",
      "project-1"
    );
    expect(post).toHaveBeenCalledWith(
      "/timelines/sheets-1/sheets/baker/images",
      { asset_id: "cloud-asset-1" }
    );
  });

  it("keeps a local project's entity image on the desktop", async () => {
    const update = vi.fn().mockResolvedValue({
      token: "baker",
      name: "Baker",
      layer_id: "layer-1",
      images: []
    });
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      projects: { get: vi.fn().mockResolvedValue({ origin: "local" }) },
      scriptProjects: { update }
    });

    await postSheetGroupImage({
      projectId: "project-1",
      timelineId: "sheets-1",
      token: "baker",
      assetId: "local-asset-1"
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "add-sheet-image",
        payload: { token: "baker", assetId: "local-asset-1" }
      })
    );
    expect(ensureCloudImageAsset).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
