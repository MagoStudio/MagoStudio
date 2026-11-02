import { describe, expect, it } from "vitest";

import type { StarterInstallFile } from "../../../../../desktop/shared/contracts";

import { describeDownloadFileProgress } from "./describeDownloadFileProgress";

const BYTES_PER_GIB = 1_073_741_824;

const file = (overrides: Partial<StarterInstallFile>): StarterInstallFile => ({
  name: "model.safetensors",
  url: "https://example.com/model.safetensors",
  destination: "models/model.safetensors",
  bytes: 4 * BYTES_PER_GIB,
  downloadedBytes: 0,
  state: "waiting",
  ...overrides
});

describe("download file progress", () => {
  it("shows the file size before the download starts and once it is done", () => {
    expect(describeDownloadFileProgress(file({}), false)).toBe("4.0 GB");
    expect(
      describeDownloadFileProgress(
        file({ state: "done", downloadedBytes: 4 * BYTES_PER_GIB }),
        false
      )
    ).toBe("4.0 GB");
  });

  it("shows the percentage while downloading, marked when paused", () => {
    const halfDownloaded = file({
      state: "downloading",
      downloadedBytes: 2 * BYTES_PER_GIB
    });
    expect(describeDownloadFileProgress(halfDownloaded, false)).toBe("50%");
    expect(describeDownloadFileProgress(halfDownloaded, true)).toBe(
      "Paused · 50%"
    );
  });

  it("names verifying and failed files instead of a number", () => {
    expect(
      describeDownloadFileProgress(file({ state: "verifying" }), false)
    ).toBe("Verifying");
    expect(describeDownloadFileProgress(file({ state: "error" }), false)).toBe(
      "Failed"
    );
  });
});
