import { CutShot } from "@schemas/scriptProject";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDownloadCut } from "./useDownloadCut";

const triggerBlobDownload = vi.hoisted(() => vi.fn());
vi.mock("@hooks/files/utils", () => ({
  triggerBlobDownload
}));

const zipBlobs = vi.hoisted(() => vi.fn(async () => new Blob(["zipped"])));
vi.mock("@app/services/zip/zipBlobs", () => ({ zipBlobs }));

const toast = vi.hoisted(() => ({ showErrorToast: vi.fn() }));
vi.mock("@store/useToast", () => ({
  useToast: () => ({ showErrorToast: toast.showErrorToast })
}));

const mockOkResponse = (): Response =>
  ({
    ok: true,
    status: 200,
    blob: async () => new Blob(["video"]),
    arrayBuffer: async () => new ArrayBuffer(4)
  }) as Response;

const mockFailedResponse = (status: number): Response =>
  ({ ok: false, status }) as Response;

const buildShot = (overrides: Partial<CutShot> = {}): CutShot => ({
  timeline_id: "shot-1",
  shot_index: 1,
  sequence_id: 1,
  heading: "INT. ROOM - DAY",
  asset_id: "asset-1",
  pinned_asset_id: "asset-1",
  version_name: "shot1_v1",
  is_upscale: false,
  url: "https://example.test/shot1.mp4",
  poster_url: null,
  versions: [],
  ...overrides
});

describe("useDownloadCut", () => {
  beforeEach(() => {
    triggerBlobDownload.mockClear();
    zipBlobs.mockClear();
    toast.showErrorToast.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  describe("downloadOneShot", () => {
    it("reports a failure and saves nothing when the asset URL no longer resolves", async () => {
      vi.mocked(fetch).mockResolvedValue(mockFailedResponse(403));
      const { result } = renderHook(() => useDownloadCut([]));

      await act(() => result.current.downloadOneShot(buildShot()));

      expect(triggerBlobDownload).not.toHaveBeenCalled();
      expect(toast.showErrorToast).toHaveBeenCalledWith({
        message: expect.any(String),
        onRetry: expect.any(Function)
      });
    });

    it("saves the video and reports nothing on success", async () => {
      vi.mocked(fetch).mockResolvedValue(mockOkResponse());
      const { result } = renderHook(() => useDownloadCut([]));

      await act(() => result.current.downloadOneShot(buildShot()));

      expect(triggerBlobDownload).toHaveBeenCalledTimes(1);
      expect(toast.showErrorToast).not.toHaveBeenCalled();
    });

    it("does nothing for a Shot with no asset URL", async () => {
      const { result } = renderHook(() => useDownloadCut([]));

      await act(() => result.current.downloadOneShot(buildShot({ url: null })));

      expect(fetch).not.toHaveBeenCalled();
      expect(triggerBlobDownload).not.toHaveBeenCalled();
      expect(toast.showErrorToast).not.toHaveBeenCalled();
    });
  });

  describe("downloadCut", () => {
    it("reports a failure and saves nothing when any Shot's download fails", async () => {
      vi.mocked(fetch).mockResolvedValue(mockFailedResponse(500));
      const { result } = renderHook(() =>
        useDownloadCut([buildShot(), buildShot({ timeline_id: "shot-2" })])
      );

      await act(() => result.current.downloadCut());

      expect(zipBlobs).not.toHaveBeenCalled();
      expect(triggerBlobDownload).not.toHaveBeenCalled();
      expect(toast.showErrorToast).toHaveBeenCalledWith({
        message: expect.any(String),
        onRetry: expect.any(Function)
      });
      expect(result.current.isDownloadingCut).toBe(false);
    });

    it("zips and saves every downloadable Shot on success", async () => {
      vi.mocked(fetch).mockResolvedValue(mockOkResponse());
      const { result } = renderHook(() =>
        useDownloadCut([buildShot(), buildShot({ timeline_id: "shot-2" })])
      );

      await act(() => result.current.downloadCut());

      expect(zipBlobs).toHaveBeenCalledTimes(1);
      expect(triggerBlobDownload).toHaveBeenCalledTimes(1);
      expect(toast.showErrorToast).not.toHaveBeenCalled();
    });

    it("excludes a Shot with no asset URL from the count and the zip", () => {
      const { result } = renderHook(() =>
        useDownloadCut([buildShot(), buildShot({ url: null })])
      );

      expect(result.current.downloadableShotCount).toBe(1);
    });
  });
});
