import { describe, expect, it } from "vitest";

import {
  LOCAL_MODEL_BUNDLES,
  LocalModelBundle,
  requiredBundles,
  totalBytesForBundles
} from "./localModelManifest";

describe("local model manifest", () => {
  it("gives every file a target path under models and an absolute url", () => {
    for (const bundle of LOCAL_MODEL_BUNDLES) {
      for (const file of bundle.files) {
        expect(file.targetPath.startsWith("models/")).toBe(true);
        expect(file.url.startsWith("https://")).toBe(true);
        expect(file.bytes).toBeGreaterThan(0);
      }
    }
  });

  it("names every file exactly once across bundles", () => {
    const paths = LOCAL_MODEL_BUNDLES.flatMap((bundle) =>
      bundle.files.map((file) => file.targetPath)
    );
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("totals the bytes of every file it is given", () => {
    const bundles: LocalModelBundle[] = [
      {
        id: "a",
        name: "A",
        isOptional: false,
        files: [
          { targetPath: "models/a", url: "https://example.com/a", bytes: 10 },
          { targetPath: "models/b", url: "https://example.com/b", bytes: 5 }
        ]
      },
      {
        id: "b",
        name: "B",
        isOptional: true,
        files: [
          { targetPath: "models/c", url: "https://example.com/c", bytes: 2 }
        ]
      }
    ];
    expect(totalBytesForBundles(bundles)).toBe(17);
    expect(totalBytesForBundles(requiredBundles(bundles))).toBe(15);
  });

  it("installs the high quality timeline with the starter models", () => {
    const required = requiredBundles(LOCAL_MODEL_BUNDLES).map((b) => b.id);
    expect(required).toContain("minimax-h3");
    expect(required).toContain("minimax-h3-high-quality");
  });
});
