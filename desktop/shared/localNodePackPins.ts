/** Pinned to the node sources in ComfyUI_windows_portable_mago.zip.
 * Bundle SHA-256: 4319814af3bfe8b446b02bc69db9bd5531cb13dc16db79f3455f6ea8f54b22da
 * Registry files match byte-for-byte; Git checkouts match after CRLF normalization.
 * Updates require comparing against a reviewed bundle and recording new hashes.
 */
export interface LocalNodePackPin {
  revision: string;
  url: string;
  sha256: string;
  stripRoot: boolean;
}
export const LOCAL_NODE_PACK_PINS: Readonly<Record<string, LocalNodePackPin>> =
  {
    "https://github.com/city96/ComfyUI-GGUF": {
      revision: "1.1.10",
      url: "https://cdn.comfy.org/city96/ComfyUI-GGUF/1.1.10/node.zip",
      sha256:
        "20bf8136b42a970242e0ee7069f0ba70350184da1305c212882fd89534dd328b",
      stripRoot: false
    },
    "https://github.com/kijai/ComfyUI-KJNodes": {
      revision: "1.5.0",
      url: "https://cdn.comfy.org/kijai/comfyui-kjnodes/1.5.0/node.zip",
      sha256:
        "a7a41da994ecd1fa4327a6a41f0df54c743132d2db21f620890ff6570982a39e",
      stripRoot: false
    },
    "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite": {
      revision: "1.7.9",
      url: "https://cdn.comfy.org/kosinkadink/comfyui-videohelpersuite/1.7.9/node.zip",
      sha256:
        "ac63991d8b237afe5b2cd2b287a14b4a4d40ff203c0f2ee9d5fe61059f57cdf8",
      stripRoot: false
    },
    "https://github.com/MagoStudio/ComfyUI-MagoNodes": {
      revision: "63e0307d59ce15341f38f9928f66e0f3e91a4709",
      url: "https://github.com/MagoStudio/ComfyUI-MagoNodes/archive/63e0307d59ce15341f38f9928f66e0f3e91a4709.zip",
      sha256:
        "370ce11404bc28f439d940db93728819394157f6a96bc58c1fd30c1f9f64d9ac",
      stripRoot: true
    },
    "https://github.com/Jalen-Brunson/ComfyUI-MiniMax-H3-PDD-Acc": {
      revision: "311a65dd53832d8a5f8177a9d5fb923c09e35a90",
      url: "https://github.com/Jalen-Brunson/ComfyUI-MiniMax-H3-PDD-Acc/archive/311a65dd53832d8a5f8177a9d5fb923c09e35a90.zip",
      sha256:
        "b106b37d7e7e9b8ee1773a7387b623065e7e5dd0747de75610ce820004893dab",
      stripRoot: true
    },
    "https://github.com/KLL535/ComfyUI_Simple_Qwen3-VL-gguf": {
      revision: "85b92359595a450d6c37f0eccf210a8a1069f72e",
      url: "https://github.com/KLL535/ComfyUI_Simple_Qwen3-VL-gguf/archive/85b92359595a450d6c37f0eccf210a8a1069f72e.zip",
      sha256:
        "84502ab5703bcc8c447f951b299a009787d7fb2e59bf92ce04f6cfd37905558e",
      stripRoot: true
    }
  };
