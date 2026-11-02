import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { demand, release } = vi.hoisted(() => ({
  demand: vi.fn(),
  release: vi.fn()
}));

vi.mock("../utils/mediaDownloadScheduler", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../utils/mediaDownloadScheduler")>()),
  mediaDownloads: { demand: demand.mockImplementation(() => release) }
}));
vi.mock("@platform/identity", () => ({
  useAuth: () => ({ getToken: vi.fn() })
}));

import { useGetVideoAsset } from "./useGetVideoAsset";

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const stubAsset = (data: Record<string, unknown>) =>
  vi.stubGlobal("mago", {
    assets: {
      get: vi.fn().mockResolvedValue({
        id: "asset-1",
        filepath: "mago-media://asset/asset-1",
        data
      })
    }
  });

describe("useGetVideoAsset (desktop)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("withholds the URL of a cloud video that is still downloading and asks for it sooner", async () => {
    stubAsset({ cloudMirror: true, status: "created" });

    const { result, unmount } = renderHook(
      () => useGetVideoAsset({ assetId: "asset-1" }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toMatchObject({ urlToUse: "" });
    expect(demand).toHaveBeenCalledWith("asset-1", 3);
    unmount();
    expect(release).toHaveBeenCalledOnce();
  });

  it("hands out the URL once the cloud video is on disk", async () => {
    stubAsset({ cloudMirror: true, status: "ingested" });

    const { result } = renderHook(
      () => useGetVideoAsset({ assetId: "asset-1" }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toMatchObject({
      urlToUse: "mago-media://asset/asset-1"
    });
  });

  it("never withholds the URL of a plain local video", async () => {
    stubAsset({ status: "created" });

    const { result } = renderHook(
      () => useGetVideoAsset({ assetId: "asset-1" }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toMatchObject({
      urlToUse: "mago-media://asset/asset-1"
    });
  });
});
