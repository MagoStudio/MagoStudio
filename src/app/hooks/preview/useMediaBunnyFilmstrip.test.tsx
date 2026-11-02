import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMediaBunnyFilmstrip } from "./useMediaBunnyFilmstrip";

const generateFilmstrip = vi.fn();
const cacheVideoUrl = vi.fn();
const useVideoAsset = vi.fn();

vi.mock("@app/services/mediaBunny", () => ({
  generateFilmstrip: (...args: unknown[]) => generateFilmstrip(...args)
}));
vi.mock("@domains/asset/utils/cacheVideoUrl", () => ({
  cacheVideoUrl: (...args: unknown[]) => cacheVideoUrl(...args)
}));
vi.mock("@domains/asset/useVideoAsset", () => ({
  useVideoAsset: (props: unknown) => useVideoAsset(props)
}));
vi.mock("@domains/asset/utils/filmstripCache", () => ({
  getFilmstripFromCache: async () => null,
  saveFilmstripToCache: async () => {}
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

describe("useMediaBunnyFilmstrip with a caller-supplied video url", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useVideoAsset.mockReturnValue({ data: undefined, isLoading: false });
    cacheVideoUrl.mockResolvedValue({ urlToUse: "blob:video", isCached: true });
    generateFilmstrip.mockResolvedValue("data:filmstrip");
    URL.revokeObjectURL = vi.fn();
  });

  it("skips the asset lookup and builds the filmstrip from the cached download", async () => {
    const { result } = renderHook(
      () =>
        useMediaBunnyFilmstrip({
          assetId: "asset",
          trackId: "",
          width: 300,
          fps: 24,
          videoUrl: "https://s3/render.mp4",
          enabled: true
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toBe("data:filmstrip"));
    expect(useVideoAsset).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
    expect(cacheVideoUrl).toHaveBeenCalledWith(
      "https://s3/render.mp4",
      "asset"
    );
    expect(generateFilmstrip).toHaveBeenCalledWith(
      "blob:video",
      expect.objectContaining({ width: 300, fps: 24 })
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:video");
  });
});
