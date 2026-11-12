import { describe, expect, it } from "vitest";

import { findComfyNodeRequirement } from "./findComfyNodeRequirement";

describe("findComfyNodeRequirement", () => {
  it("finds the downloadable node pack that provides a custom node", () => {
    expect(findComfyNodeRequirement("UnetLoaderGGUF")).toMatchObject({
      name: "UnetLoaderGGUF",
      url: "https://github.com/city96/ComfyUI-GGUF",
      installKind: "node",
      status: "missing",
      downloadUrl: expect.any(String)
    });
  });

  it("treats a core node as a ComfyUI update without a download", () => {
    const requirement = findComfyNodeRequirement("VAELoader");
    expect(requirement).toMatchObject({
      installKind: "core",
      url: "https://github.com/Comfy-Org/ComfyUI",
      status: "missing"
    });
    expect(requirement.downloadUrl).toBeUndefined();
  });

  it("falls back to a ComfyUI update for a node the catalog does not know", () => {
    expect(findComfyNodeRequirement("SomeUnknownLoader")).toEqual({
      name: "SomeUnknownLoader",
      url: "https://github.com/Comfy-Org/ComfyUI",
      installKind: "core",
      status: "missing"
    });
  });
});
