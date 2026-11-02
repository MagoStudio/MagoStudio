import { describe, expect, it } from "vitest";

import { evaluateScriptSetup } from "./probeScriptSetup";
import { inferSetupFolders, addSetupDestinations } from "./setupDestinations";

describe("setup destination inference", () => {
  it("uses absolute startup paths without duplicating ComfyUI", () => {
    const result = addSetupDestinations(
      evaluateScriptSetup({}),
      { system: { argv: ["C:\\tools\\ComfyUI\\main.py"] } },
      []
    );
    expect(
      result.nodes.find((item) => item.name === "MiniMaxChunkFeedForward")
        ?.folder
    ).toBe("C:\\tools\\ComfyUI\\custom_nodes");
    expect(
      result.nodes.find((item) => item.name === "MiniMaxChunkFeedForward")
        ?.downloadUrl
    ).toBe("https://cdn.comfy.org/kijai/comfyui-kjnodes/1.5.0/node.zip");
    expect(
      result.nodes.find((item) => item.name === "VAELoader")?.installKind
    ).toBe("core");
    expect(
      result.nodes.find((item) => item.name === "VAELoader")?.downloadUrl
    ).toBeUndefined();
  });
  it("prefers configured model folders over the inferred root", () => {
    const result = addSetupDestinations(
      evaluateScriptSetup({}),
      { system: { argv: ["/opt/ComfyUI/main.py"] } },
      [{ name: "vae", folders: ["/mnt/models/vae"] }]
    );
    expect(
      result.models.find((item) => item.name.includes("video_vae"))?.folder
    ).toBe("/mnt/models/vae");
  });
  it("infers conventional layouts but does not mistake external model stores for ComfyUI", () => {
    expect(
      inferSetupFolders({}, [
        { name: "vae", folders: ["D:\\ComfyUI\\models\\vae"] }
      ]).root
    ).toBe("D:\\ComfyUI");
    expect(
      inferSetupFolders({ system: { argv: ["main.py"] } }, [
        { name: "vae", folders: ["/mnt/models/vae"] }
      ]).root
    ).toBeUndefined();
  });
  it("retains clear fallback destinations and resolves model repository links", () => {
    const result = addSetupDestinations(evaluateScriptSetup({}), null, null);
    expect(result.models[0].folder).toBe("<ComfyUI>/models/diffusion_models");
    const caption = result.optional[1].requirements.find((item) =>
      item.name.endsWith(".gguf")
    );
    expect(caption?.downloadUrl).toContain("/resolve/main/");
    expect(caption?.folder).toBe("<ComfyUI>/models/LLM/GGUF");
  });

  it("keeps each per-file setup's stable id", () => {
    const status = evaluateScriptSetup({});
    expect(
      addSetupDestinations(status, null, null).optional.map((setup) => setup.id)
    ).toEqual(status.optional.map((setup) => setup.id));
  });
});
