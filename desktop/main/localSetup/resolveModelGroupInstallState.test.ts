import { describe, expect, it } from "vitest";

import type { ModelGroupItem } from "./listModelGroupItems";
import { resolveModelGroupInstallState } from "./resolveModelGroupInstallState";

const nodePack: ModelGroupItem = {
  kind: "node-pack",
  name: "ComfyUI-GGUF",
  sha256: "node-pack-v1",
  downloadUrl: "https://example.test/gguf.zip",
  archiveStripRoot: false,
  absolutePath: "/engine/ComfyUI/custom_nodes/ComfyUI-GGUF"
};
const unet: ModelGroupItem = {
  kind: "model-file",
  name: "unet.gguf",
  sha256: "unet-v1",
  bytes: 10,
  downloadUrl: "https://example.test/unet.gguf",
  absolutePath: "/engine/ComfyUI/models/unet/unet.gguf"
};
const vae: ModelGroupItem = {
  ...unet,
  name: "vae.safetensors",
  sha256: "vae-v1",
  absolutePath: "/engine/ComfyUI/models/vae/vae.safetensors"
};
const items = [nodePack, unet, vae];

describe("resolveModelGroupInstallState", () => {
  it("is installed when every current item is recorded and on disk", () => {
    expect(
      resolveModelGroupInstallState({
        items,
        recordedItemSha256s: ["node-pack-v1", "unet-v1", "vae-v1"],
        presentItems: new Set(items)
      })
    ).toEqual({
      state: "installed",
      missingItems: [],
      shouldRecordAsInstalled: false
    });
  });

  it("is partial when an app update replaces a file with a new version", () => {
    const updatedUnet = { ...unet, sha256: "unet-v2" };
    const result = resolveModelGroupInstallState({
      items: [nodePack, updatedUnet, vae],
      recordedItemSha256s: ["node-pack-v1", "unet-v1", "vae-v1"],
      presentItems: new Set([nodePack, updatedUnet, vae])
    });
    expect(result.state).toBe("partial");
    expect(result.missingItems).toEqual([updatedUnet]);
  });

  it("is partial when an app update adds a file to the group", () => {
    const addedLora = { ...unet, sha256: "lora-v1", name: "lora.safetensors" };
    const result = resolveModelGroupInstallState({
      items: [...items, addedLora],
      recordedItemSha256s: ["node-pack-v1", "unet-v1", "vae-v1"],
      presentItems: new Set(items)
    });
    expect(result.state).toBe("partial");
    expect(result.missingItems).toEqual([addedLora]);
  });

  it("is partial when an app update re-pins a node pack", () => {
    const repinnedNodePack = { ...nodePack, sha256: "node-pack-v2" };
    const result = resolveModelGroupInstallState({
      items: [repinnedNodePack, unet, vae],
      recordedItemSha256s: ["node-pack-v1", "unet-v1", "vae-v1"],
      presentItems: new Set([repinnedNodePack, unet, vae])
    });
    expect(result.missingItems).toEqual([repinnedNodePack]);
  });

  it("is partial when a recorded file was deleted from disk", () => {
    const result = resolveModelGroupInstallState({
      items,
      recordedItemSha256s: ["node-pack-v1", "unet-v1", "vae-v1"],
      presentItems: new Set([nodePack, unet])
    });
    expect(result.state).toBe("partial");
    expect(result.missingItems).toEqual([vae]);
  });

  it("records an install made before group records existed when every item is on disk", () => {
    expect(
      resolveModelGroupInstallState({
        items,
        recordedItemSha256s: undefined,
        presentItems: new Set(items)
      })
    ).toEqual({
      state: "installed",
      missingItems: [],
      shouldRecordAsInstalled: true
    });
  });

  it("is partial for an unrecorded group with only some model files on disk", () => {
    const result = resolveModelGroupInstallState({
      items,
      recordedItemSha256s: undefined,
      presentItems: new Set([nodePack, unet])
    });
    expect(result).toEqual({
      state: "partial",
      missingItems: [vae],
      shouldRecordAsInstalled: false
    });
  });

  it("is not installed when only a bundled node pack is on disk", () => {
    const result = resolveModelGroupInstallState({
      items,
      recordedItemSha256s: undefined,
      presentItems: new Set([nodePack])
    });
    expect(result.state).toBe("not-installed");
  });
});
