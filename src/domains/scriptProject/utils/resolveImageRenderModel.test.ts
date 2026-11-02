import { describe, expect, it } from "vitest";

import { resolveImageRenderModel } from "./resolveImageRenderModel";

describe("image model defaults", () => {
  const resolve = (
    extra: Partial<Parameters<typeof resolveImageRenderModel>[0]> = {}
  ) =>
    resolveImageRenderModel({
      savedModel: undefined,
      isLocalProject: true,
      isCloudAvailable: false,
      installedLocalModels: [],
      ...extra
    });
  it("defaults signed-in local projects to GPT Image 2", () =>
    expect(resolve({ isCloudAvailable: true })).toBe("gpt_image_2_t2i"));
  it("defaults offline projects without installed image models to Qwen for setup", () =>
    expect(resolve()).toBe("qwen_image_2512_local"));
  it("uses an installed Flux model and prefers Qwen when both are installed", () => {
    expect(resolve({ installedLocalModels: ["flux2_klein_4b_q8_local"] })).toBe(
      "flux2_klein_4b_q8_local"
    );
    expect(
      resolve({
        installedLocalModels: [
          "flux2_klein_4b_q8_local",
          "qwen_image_2512_local"
        ]
      })
    ).toBe("qwen_image_2512_local");
  });
  it("keeps a saved local selection and only keeps saved cloud models while signed in", () => {
    expect(
      resolve({ savedModel: "flux2_klein_9b_q8_local", isCloudAvailable: true })
    ).toBe("flux2_klein_9b_q8_local");
    expect(
      resolve({ savedModel: "seedream_5_pro_t2i", isCloudAvailable: true })
    ).toBe("seedream_5_pro_t2i");
    expect(resolve({ savedModel: "seedream_5_pro_t2i" })).toBe(
      "qwen_image_2512_local"
    );
  });
  it("preserves the supported cloud-project rendering path", () => {
    expect(resolve({ isLocalProject: false })).toBe("gpt_image_2_t2i");
    expect(
      resolve({ isLocalProject: false, savedModel: "nanobanana_2_t2i" })
    ).toBe("nanobanana_2_t2i");
  });
});
