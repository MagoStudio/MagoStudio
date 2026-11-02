import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  confirmAndCopyInstallerModels,
  modelCopyConfirmationMessage
} from "./confirmAndCopyInstallerModels";
import type { CopyModelToRunningComfy } from "./copyModelsToRunningComfy";

const item = {
  kind: "model-file" as const,
  name: "model.safetensors",
  bytes: 3_600_000_000,
  absolutePath: path.resolve("managed/models/loras/model.safetensors"),
  sha256: "model-hash",
  downloadUrl: "https://example.test/model"
};
const fixture = () => {
  const copy = Object.assign(
    vi.fn(async () => {}),
    { comfyRoot: path.resolve("external/ComfyUI") }
  );
  return {
    endpoint: "http://127.0.0.1:8188",
    managedComfyDirectory: path.resolve("managed/ComfyUI"),
    items: [item],
    signal: new AbortController().signal,
    confirmCopy: vi.fn(async () => true),
    showCopyError: vi.fn(async () => {}),
    prepareCopy: vi.fn(async () => copy as CopyModelToRunningComfy),
    copy
  };
};

describe("installer model copy confirmation", () => {
  it("asks once with the total additional size before copying unique files", async () => {
    const options = fixture();
    options.items = [item, item];
    await confirmAndCopyInstallerModels(options);
    expect(options.confirmCopy).toHaveBeenCalledExactlyOnceWith(item.bytes);
    expect(options.confirmCopy.mock.invocationCallOrder[0]).toBeLessThan(
      options.copy.mock.invocationCallOrder[0]
    );
    expect(options.copy).toHaveBeenCalledExactlyOnceWith(item, options.signal);
    expect(modelCopyConfirmationMessage(item.bytes)).toContain(
      "3.6 GB of disk space"
    );
  });

  it("does not copy when the user declines", async () => {
    const options = fixture();
    options.confirmCopy.mockResolvedValue(false);
    await confirmAndCopyInstallerModels(options);
    expect(options.copy).not.toHaveBeenCalled();
    expect(options.showCopyError).not.toHaveBeenCalled();
  });

  it("does not ask to duplicate files into the same bundled ComfyUI", async () => {
    const options = fixture();
    options.copy.comfyRoot = options.managedComfyDirectory;
    await confirmAndCopyInstallerModels(options);
    expect(options.confirmCopy).not.toHaveBeenCalled();
    expect(options.copy).not.toHaveBeenCalled();
  });

  it("shows the manual-copy error when the server folder cannot be accessed", async () => {
    const options = fixture();
    await confirmAndCopyInstallerModels({
      ...options,
      prepareCopy: async () => null
    });
    expect(options.showCopyError).toHaveBeenCalledOnce();
    expect(options.confirmCopy).not.toHaveBeenCalled();
    expect(options.copy).not.toHaveBeenCalled();
  });

  it("shows the manual-copy error when an approved copy fails", async () => {
    const options = fixture();
    options.copy.mockRejectedValue(new Error("Access denied"));
    await confirmAndCopyInstallerModels(options);
    expect(options.showCopyError).toHaveBeenCalledOnce();
  });

  it("does not show a copy error for a paused install", async () => {
    const options = fixture();
    const controller = new AbortController();
    options.copy.mockImplementation(async () => {
      controller.abort();
      controller.signal.throwIfAborted();
    });
    await expect(
      confirmAndCopyInstallerModels({ ...options, signal: controller.signal })
    ).rejects.toThrow();
    expect(options.showCopyError).not.toHaveBeenCalled();
  });
});
