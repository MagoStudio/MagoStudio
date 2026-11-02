import { afterEach, describe, expect, it, vi } from "vitest";

import { uploadAssetToS3 } from "./putAssetOnS3.local";

type ProgressListener = (event: { assetId: string; fraction: number }) => void;

const stubCloud = () => {
  let listener: ProgressListener = () => {};
  const unsubscribe = vi.fn();
  const cloud = {
    uploadBytes: vi.fn(async (input: { uploadId: string }) => {
      listener({ assetId: "someone-else", fraction: 0.9 });
      listener({ assetId: input.uploadId, fraction: 0.5 });
      listener({ assetId: input.uploadId, fraction: 1 });
    }),
    cancelUploadBytes: vi.fn().mockResolvedValue(undefined),
    onUploadProgress: vi.fn((next: ProgressListener) => {
      listener = next;
      return unsubscribe;
    })
  };
  vi.stubGlobal("mago", { cloud });
  return { cloud, unsubscribe };
};

describe("uploadAssetToS3 (desktop)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hands the file to the main process instead of PUTting from the page", async () => {
    const { cloud, unsubscribe } = stubCloud();
    const progress: number[] = [];

    await uploadAssetToS3({
      s3_url: "https://bucket.example/upload?sig=1",
      file: new File(["video"], "a.mp4", { type: "video/mp4" }),
      onUploadProgress: (value) => progress.push(value)
    });

    expect(cloud.uploadBytes).toHaveBeenCalledWith({
      uploadId: expect.any(String),
      presignedUrl: "https://bucket.example/upload?sig=1",
      contentType: "video/mp4",
      bytes: expect.any(ArrayBuffer)
    });
    expect(progress).toEqual([50, 100]);
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("does not start an upload whose signal is already aborted", async () => {
    const { cloud } = stubCloud();
    const controller = new AbortController();
    controller.abort();

    await expect(
      uploadAssetToS3({
        s3_url: "https://bucket.example/upload",
        file: new File(["video"], "a.mp4", { type: "video/mp4" }),
        signal: controller.signal
      })
    ).rejects.toThrow();
    expect(cloud.uploadBytes).not.toHaveBeenCalled();
  });
});
