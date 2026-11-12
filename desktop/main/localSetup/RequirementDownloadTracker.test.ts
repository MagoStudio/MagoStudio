import { describe, expect, it, vi } from "vitest";

import {
  DOWNLOAD_CANCELLED_BY_USER,
  RequirementDownloadTracker
} from "./RequirementDownloadTracker";

const GIB = 1_073_741_824;
const createTracker = () => {
  const deletePartialDownload = vi.fn(async () => {});
  return {
    tracker: new RequirementDownloadTracker(deletePartialDownload),
    deletePartialDownload
  };
};

describe("RequirementDownloadTracker", () => {
  it("reports progress while a download runs and keeps it once saved", async () => {
    const { tracker } = createTracker();
    let finishDownload = () => {};
    const download = tracker.track(
      "model.gguf",
      new AbortController().signal,
      (reportProgress) =>
        new Promise((resolve) => {
          reportProgress(GIB, 4 * GIB);
          finishDownload = () => resolve({ outcome: "saved", savedTo: "D:/m" });
        })
    );
    expect(tracker.read("model.gguf")).toEqual({
      phase: "downloading",
      downloadedBytes: GIB,
      totalBytes: 4 * GIB,
      error: null
    });
    finishDownload();
    await download;
    expect(tracker.read("model.gguf")?.phase).toBe("done");
  });

  it("marks a paused download as paused and resumes from its last progress", async () => {
    const { tracker } = createTracker();
    const controller = new AbortController();
    await expect(
      tracker.track("model.gguf", controller.signal, async (reportProgress) => {
        reportProgress(2 * GIB, 4 * GIB);
        controller.abort();
        throw new Error("This operation was aborted");
      })
    ).rejects.toThrow();
    expect(tracker.read("model.gguf")).toMatchObject({
      phase: "paused",
      downloadedBytes: 2 * GIB
    });
    let statusWhileResuming = tracker.read("model.gguf");
    await tracker.track(
      "model.gguf",
      new AbortController().signal,
      async () => {
        statusWhileResuming = tracker.read("model.gguf");
        return { outcome: "saved", savedTo: "D:/m" };
      }
    );
    expect(statusWhileResuming).toMatchObject({
      phase: "downloading",
      downloadedBytes: 2 * GIB
    });
  });

  it("starts a new download of a finished file from zero", async () => {
    const { tracker } = createTracker();
    await tracker.track(
      "model.gguf",
      new AbortController().signal,
      async (reportProgress) => {
        reportProgress(4 * GIB, 4 * GIB);
        return { outcome: "saved", savedTo: "D:/m" };
      }
    );
    let statusWhenRestarted = tracker.read("model.gguf");
    await tracker.track(
      "model.gguf",
      new AbortController().signal,
      async () => {
        statusWhenRestarted = tracker.read("model.gguf");
        return null;
      }
    );
    expect(statusWhenRestarted).toMatchObject({
      phase: "downloading",
      downloadedBytes: 0,
      totalBytes: null
    });
  });

  it("marks a failed download as an error", async () => {
    const { tracker } = createTracker();
    await expect(
      tracker.track("model.gguf", new AbortController().signal, async () => {
        throw new Error("Checksum mismatch");
      })
    ).rejects.toThrow();
    expect(tracker.read("model.gguf")).toMatchObject({
      phase: "error",
      error: "Checksum mismatch"
    });
  });

  it("deletes the partial file of a running download the user cancelled", async () => {
    const { tracker, deletePartialDownload } = createTracker();
    const controller = new AbortController();
    const result = await tracker.track(
      "model.gguf",
      controller.signal,
      async (reportProgress, reportDestination) => {
        reportDestination("D:/models/model.gguf");
        reportProgress(GIB, 4 * GIB);
        controller.abort(DOWNLOAD_CANCELLED_BY_USER);
        throw new Error("This operation was aborted");
      }
    );
    expect(result).toBeNull();
    expect(tracker.read("model.gguf")).toBeNull();
    expect(deletePartialDownload).toHaveBeenCalledWith("D:/models/model.gguf");
  });

  it("deletes the partial file of a paused download when it is discarded", async () => {
    const { tracker, deletePartialDownload } = createTracker();
    const controller = new AbortController();
    await expect(
      tracker.track(
        "model.gguf",
        controller.signal,
        async (_reportProgress, reportDestination) => {
          reportDestination("D:/models/model.gguf");
          controller.abort();
          throw new Error("This operation was aborted");
        }
      )
    ).rejects.toThrow();
    expect(deletePartialDownload).not.toHaveBeenCalled();
    await tracker.discard("model.gguf");
    expect(tracker.read("model.gguf")).toBeNull();
    expect(deletePartialDownload).toHaveBeenCalledWith("D:/models/model.gguf");
  });

  it("forgets a download that was cancelled before it started", async () => {
    const { tracker } = createTracker();
    await tracker.track(
      "model.gguf",
      new AbortController().signal,
      async () => null
    );
    expect(tracker.read("model.gguf")).toBeNull();
  });
});
