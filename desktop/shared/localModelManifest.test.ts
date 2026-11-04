import { describe, expect, it } from "vitest";

import {
  LOCAL_MODEL_BUNDLES,
  LocalModelBundle,
  requiredBundles,
  totalBytesForBundles
} from "./localModelManifest";
import { MINIMAX_H3_STEP_LORAS } from "./minimaxH3StepLoras";

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

  it("installs the HD step LoRA with the starter models and keeps draft and turbo optional", () => {
    const required = requiredBundles(LOCAL_MODEL_BUNDLES).map((b) => b.id);
    expect(required).toContain("minimax-h3");
    expect(required).not.toContain("minimax-h3-draft-lora");
    expect(required).not.toContain("minimax-h3-turbo-lora");
    expect(
      LOCAL_MODEL_BUNDLES.find((bundle) => bundle.id === "minimax-h3")?.files
    ).toContainEqual(
      expect.objectContaining({
        targetPath: `models/loras/${MINIMAX_H3_STEP_LORAS[8].loraFile}`
      })
    );
  });

  it("pins every Pika H3 Flex Turbo LoRA download to a revision with a checksum", () => {
    const pikaLoraFiles = LOCAL_MODEL_BUNDLES.flatMap((bundle) =>
      bundle.files.filter((file) =>
        file.url.includes("Pika-Labs/Pika-H3-Flex-Turbo-LoRA")
      )
    );
    expect(pikaLoraFiles).toHaveLength(3);
    for (const file of pikaLoraFiles) {
      expect(file.url).toContain(
        "/resolve/dcacd93a50f714ba1cd61c7ca2cc5f65e9a1ec60/"
      );
      expect(file.url).not.toContain("/resolve/main/");
      expect(file.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("drops the retired PDD accelerator and old step LoRAs", () => {
    const urls = LOCAL_MODEL_BUNDLES.flatMap((bundle) =>
      bundle.files.map((file) => file.url)
    );
    expect(LOCAL_MODEL_BUNDLES.map((bundle) => bundle.id)).not.toContain(
      "minimax-h3-high-quality"
    );
    expect(urls.some((url) => url.includes("MiniMax-H3-Acc"))).toBe(false);
    expect(urls.some((url) => url.includes("minimax_h3_ref2v_turbo"))).toBe(
      false
    );
  });
});
