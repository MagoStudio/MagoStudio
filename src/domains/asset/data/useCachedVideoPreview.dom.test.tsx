import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { resolvePreview } = vi.hoisted(() => ({ resolvePreview: vi.fn() }));
vi.mock("../utils/resolveCachedVideoPreview", () => ({
  resolveCachedVideoPreview: resolvePreview
}));

import { useCachedVideoPreview } from "./useCachedVideoPreview";

describe("useCachedVideoPreview", () => {
  it("switches to the disk preview while the old remote preview is still queued", async () => {
    const localUrl = "mago-media://script-project/video-1";
    resolvePreview.mockImplementation(({ videoUrl }: { videoUrl: string }) =>
      videoUrl === localUrl
        ? Promise.resolve({
            videoObjectUrl: null,
            firstFrameUrl: "data:image/jpeg;base64,frame",
            isVideoAvailable: true
          })
        : new Promise(() => {})
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ videoUrl }) =>
        useCachedVideoPreview({
          assetId: "asset-1",
          videoUrl,
          fps: 24,
          loadVideo: false
        }),
      {
        wrapper,
        initialProps: { videoUrl: "https://cdn.example/video.mp4" }
      }
    );
    await waitFor(() => expect(resolvePreview).toHaveBeenCalledOnce());
    expect(result.current.isLoading).toBe(true);
    rerender({ videoUrl: localUrl });
    expect(result.current.isVideoAvailable).toBe(true);
    await waitFor(() =>
      expect(result.current.videoFirstFrameUrl).toBe(
        "data:image/jpeg;base64,frame"
      )
    );
    expect(result.current.isLoading).toBe(false);
    expect(resolvePreview).toHaveBeenCalledTimes(2);
  });
});
