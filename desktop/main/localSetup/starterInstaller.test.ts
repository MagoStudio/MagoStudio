import { describe, expect, it } from "vitest";

import {
  COMFY_STARTER_BUNDLE,
  LOCAL_MODEL_BUNDLES,
  requiredBundles,
  STARTER_REQUIRED_BYTES,
  STARTER_DOWNLOAD_BYTES
} from "../../shared/localModelManifest";
import type { LibrarySettings } from "../librarySettings";

import { StarterInstaller } from "./starterInstaller";
describe("starter installer preflight", () => {
  it("does not silently download when the release assets are missing", async () => {
    const installer = new StarterInstaller({
      getLocalModelsRoot: async () => "C:\\test"
    } as LibrarySettings);
    const urls = COMFY_STARTER_BUNDLE.partUrls;
    COMFY_STARTER_BUNDLE.partUrls = [];
    try {
      await expect(installer.start()).rejects.toThrow(
        process.platform === "win32" ? "release asset URLs" : "Windows only"
      );
    } finally {
      COMFY_STARTER_BUNDLE.partUrls = urls;
    }
    expect(installer.status().phase).toBe("idle");
    expect(installer.status().files).toEqual([]);
  });
  it("includes Qwen-VL and pins all starter model hashes", () => {
    const bundles = requiredBundles(LOCAL_MODEL_BUNDLES);
    expect(bundles.map((bundle) => bundle.id)).toEqual(
      expect.arrayContaining(["minimax-h3", "qwen-vl"])
    );
    expect(
      bundles
        .flatMap((bundle) => bundle.files)
        .every((file) => /^[a-f0-9]{64}$/.test(file.sha256 ?? ""))
    ).toBe(true);
    expect(
      COMFY_STARTER_BUNDLE.partBytes.reduce((sum, bytes) => sum + bytes, 0)
    ).toBe(COMFY_STARTER_BUNDLE.archiveBytes);
    expect(STARTER_REQUIRED_BYTES).toBe(
      STARTER_DOWNLOAD_BYTES + COMFY_STARTER_BUNDLE.extractedBytes
    );
  });
});
