import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get }
}));
vi.mock("@domains/asset/useImageAsset", () => ({
  useImageAsset: () => ({
    data: { asset: { data: {} } },
    isLoading: false
  })
}));
vi.mock("@domains/prompt/useVlmStatus", () => ({
  useVlmStatus: () => ({ isVlmReady: false })
}));

import { useGetImageAssetPrompt } from "./useGetImageAssetPrompt";

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const stubDesktop = ({
  accountMode,
  localAsset
}: {
  accountMode: "cloud" | "offline";
  localAsset: { data: Record<string, unknown> } | null;
}) => {
  const captionAsset = vi.fn();
  vi.stubGlobal("mago", {
    account: { mode: accountMode },
    assets: { get: vi.fn().mockResolvedValue(localAsset) },
    vlm: { captionAsset }
  });
  return captionAsset;
};

describe("useGetImageAssetPrompt in the desktop app without the local VLM", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("reads the prompt of a cloud asset the library does not hold from the cloud while signed in", async () => {
    const captionAsset = stubDesktop({
      accountMode: "cloud",
      localAsset: null
    });
    get.mockResolvedValue({
      data: { prompt: { positive: { content: "from the cloud" } } }
    });

    const { result } = renderHook(
      () => useGetImageAssetPrompt({ assetId: "asset-1" }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith("/assets/asset-1/prompt");
    expect(captionAsset).not.toHaveBeenCalled();
  });

  it("waits for the local VLM for a local-only asset", async () => {
    const captionAsset = stubDesktop({
      accountMode: "cloud",
      localAsset: { data: {} }
    });

    const { result } = renderHook(
      () => useGetImageAssetPrompt({ assetId: "asset-1" }),
      { wrapper }
    );

    await waitFor(() => expect(window.mago.assets.get).toHaveBeenCalled());
    expect(result.current.fetchStatus).toBe("idle");
    expect(get).not.toHaveBeenCalled();
    expect(captionAsset).not.toHaveBeenCalled();
  });

  it("never asks the cloud for an asset the library does not hold when offline", async () => {
    stubDesktop({ accountMode: "offline", localAsset: null });

    const { result } = renderHook(
      () => useGetImageAssetPrompt({ assetId: "asset-1" }),
      { wrapper }
    );

    await waitFor(() => expect(window.mago.assets.get).toHaveBeenCalled());
    expect(result.current.fetchStatus).toBe("idle");
    expect(get).not.toHaveBeenCalled();
  });
});
