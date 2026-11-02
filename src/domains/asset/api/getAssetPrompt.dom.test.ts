import { afterEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get }
}));

import { getAssetPrompt } from "./getAssetPrompt";

const CLOUD_PROMPT = { prompt: { positive: { content: "from the cloud" } } };

const stubDesktop = ({
  accountMode,
  localAsset
}: {
  accountMode: "cloud" | "offline";
  localAsset: { data: Record<string, unknown> } | null;
}) => {
  const captionAsset = vi
    .fn()
    .mockResolvedValue({ prompt: { positive: { content: "local" } } });
  vi.stubGlobal("mago", {
    account: { mode: accountMode },
    assets: { get: vi.fn().mockResolvedValue(localAsset) },
    vlm: { captionAsset }
  });
  return captionAsset;
};

describe("getAssetPrompt in the desktop app", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("reads a cloud-mirrored asset's prompt from the cloud without the local VLM", async () => {
    const captionAsset = stubDesktop({
      accountMode: "cloud",
      localAsset: { data: { cloudMirror: true } }
    });
    get.mockResolvedValue({ data: CLOUD_PROMPT });

    const response = await getAssetPrompt("asset-1");

    expect(get).toHaveBeenCalledWith("/assets/asset-1/prompt");
    expect(response).toBe(CLOUD_PROMPT);
    expect(captionAsset).not.toHaveBeenCalled();
  });

  it("reads the prompt of an asset the library does not hold from the cloud", async () => {
    const captionAsset = stubDesktop({
      accountMode: "cloud",
      localAsset: null
    });
    get.mockResolvedValue({ data: CLOUD_PROMPT });

    await getAssetPrompt("asset-1");

    expect(get).toHaveBeenCalledWith("/assets/asset-1/prompt");
    expect(captionAsset).not.toHaveBeenCalled();
  });

  it("never asks the cloud for an asset the library does not hold when offline", async () => {
    const captionAsset = stubDesktop({
      accountMode: "offline",
      localAsset: null
    });

    await getAssetPrompt("asset-1");

    expect(get).not.toHaveBeenCalled();
    expect(captionAsset).toHaveBeenCalledWith("asset-1");
  });

  it("captions a local-only asset with the local VLM even while signed in", async () => {
    const captionAsset = stubDesktop({
      accountMode: "cloud",
      localAsset: { data: {} }
    });

    const response = await getAssetPrompt("asset-1");

    expect(captionAsset).toHaveBeenCalledWith("asset-1");
    expect(response).toEqual({ prompt: { positive: { content: "local" } } });
    expect(get).not.toHaveBeenCalled();
  });

  it("captions a cloud-mirrored asset locally when working offline", async () => {
    const captionAsset = stubDesktop({
      accountMode: "offline",
      localAsset: { data: { cloudMirror: true } }
    });

    await getAssetPrompt("asset-1");

    expect(captionAsset).toHaveBeenCalledWith("asset-1");
    expect(get).not.toHaveBeenCalled();
  });

  it("requires an asset id", async () => {
    await expect(getAssetPrompt(undefined)).rejects.toThrow(
      "Asset ID is required"
    );
  });
});
