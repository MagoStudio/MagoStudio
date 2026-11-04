import { describe, expect, it } from "vitest";

import { MINIMAX_H3_STEP_LORAS } from "../../shared/minimaxH3StepLoras";
import { LOCAL_SCRIPT_MODEL_FILES as files } from "../scriptProjects/comfyScriptProjectClient";

import { evaluateScriptSetup } from "./probeScriptSetup";

const hdStepLora = MINIMAX_H3_STEP_LORAS[8].loraFile;
const turboStepLora = MINIMAX_H3_STEP_LORAS[4].loraFile;
const draftStepLora = MINIMAX_H3_STEP_LORAS[2].loraFile;

const installed = (): Record<string, unknown> => {
  const empty = evaluateScriptSetup({});
  const info: Record<string, unknown> = Object.fromEntries(
    empty.nodes.map((item) => [item.name, { input: {} }])
  );
  info.UNETLoader = { input: { required: { unet_name: [[files.videoUnet]] } } };
  info.CLIPLoader = {
    input: {
      required: {
        clip_name: ["COMBO", { options: [`minimax/${files.videoClipVanilla}`] }]
      }
    }
  };
  info.VAELoader = {
    input: { required: { vae_name: [[files.videoVae, files.audioVae]] } }
  };
  info.LoraLoaderModelOnly = {
    input: { optional: { lora_name: [[`minimax\\${hdStepLora}`]] } }
  };
  return info;
};

describe("ScriptShot minimum setup", () => {
  it("accepts vanilla and the HD step LoRA without captioning, image models, local LLM or the optional step LoRAs", () => {
    const result = evaluateScriptSetup(installed());
    expect(result.ready).toBe(true);
    expect(
      result.optionalStepLoras.every((item) => item.status === "missing")
    ).toBe(true);
    expect(result.models.map((item) => item.name)).toContain(hdStepLora);
    expect(result.models.map((item) => item.name)).toContain(
      files.videoClipVanilla
    );
    expect(result.models.map((item) => item.name)).not.toContain(
      files.videoClip
    );
  });
  it("does not accept the heretic encoder in place of vanilla", () => {
    const info = installed();
    info.CLIPLoader = {
      input: { required: { clip_name: [[files.videoClip]] } }
    };
    const result = evaluateScriptSetup(info);
    expect(result.ready).toBe(false);
    expect(
      result.models.find((item) => item.name === files.videoClipVanilla)?.status
    ).toBe("missing");
  });
  it("distinguishes missing nodes from files it cannot verify", () => {
    const info = installed();
    delete info.VAELoader;
    const result = evaluateScriptSetup(info);
    expect(result.ready).toBe(false);
    expect(result.nodes.find((item) => item.name === "VAELoader")?.status).toBe(
      "missing"
    );
    expect(
      result.models
        .filter((item) => item.folder === "models/vae/")
        .every((item) => item.status === "unknown")
    ).toBe(true);
  });
  it("reports the missing LoRA with its destination and download", () => {
    const info = installed();
    info.LoraLoaderModelOnly = { input: { required: { lora_name: [[]] } } };
    const result = evaluateScriptSetup(info);
    expect(result.ready).toBe(false);
    expect(
      result.models.find((item) => item.name === hdStepLora)
    ).toMatchObject({
      status: "missing",
      folder: "models/loras/",
      url: expect.stringContaining(hdStepLora)
    });
  });
  it("never asks for the retired PDD accelerator node", () => {
    const result = evaluateScriptSetup(installed());
    expect(result.nodes.map((item) => item.name)).not.toContain(
      "MiniMaxH3PDDAccApply"
    );
    expect(result.nodes.map((item) => item.name)).toEqual(
      expect.arrayContaining(["BasicScheduler", "LoraLoaderModelOnly"])
    );
  });
});

describe("MiniMax H3 optional step LoRAs", () => {
  it("lists the draft and turbo LoRAs with pinned downloads, without blocking readiness", () => {
    const result = evaluateScriptSetup(installed());
    expect(result.ready).toBe(true);
    expect(result.optionalStepLoras.map((item) => item.name)).toEqual([
      draftStepLora,
      turboStepLora
    ]);
    for (const stepLora of result.optionalStepLoras) {
      expect(stepLora.folder).toBe("models/loras/");
      expect(stepLora.url).toContain(
        "Pika-Labs/Pika-H3-Flex-Turbo-LoRA/resolve/dcacd93a50f714ba1cd61c7ca2cc5f65e9a1ec60/"
      );
    }
  });
  it("marks a step LoRA installed once ComfyUI lists it", () => {
    const info = installed();
    info.LoraLoaderModelOnly = {
      input: { required: { lora_name: [[hdStepLora, turboStepLora]] } }
    };
    const result = evaluateScriptSetup(info);
    expect(
      result.optionalStepLoras.find((item) => item.name === turboStepLora)
        ?.status
    ).toBe("installed");
    expect(
      result.optionalStepLoras.find((item) => item.name === draftStepLora)
        ?.status
    ).toBe("missing");
  });
});

describe("optional local models", () => {
  it("reports missing optional requirements without blocking MiniMax", () => {
    const result = evaluateScriptSetup(installed());
    expect(result.ready).toBe(true);
    expect(result.optional.map((group) => group.title)).toEqual([
      expect.stringContaining("Qwen Image 2512"),
      expect.stringContaining("Qwen3-VL"),
      expect.stringContaining("Qwen3.8 27B"),
      "Flux 2 Klein 4B — sheet generation",
      "Flux 2 Klein 9B — sheet generation"
    ]);
    expect(result.optional[0].requirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "UnetLoaderGGUF",
          status: "missing",
          url: "https://github.com/city96/ComfyUI-GGUF"
        }),
        expect.objectContaining({
          name: files.imageUnet,
          status: "unknown",
          folder: "models/unet/"
        })
      ])
    );
  });
  it("accepts supported Qwen-VL file alternatives", () => {
    const info = installed();
    info.MagoQwen3VLLoader = {
      input: {
        required: {
          gguf_name: [["GGUF/Qwen3-VL-2B-Instruct-Q8_0.gguf"]],
          mmproj_name: [["GGUF/mmproj-F16.gguf"]]
        }
      }
    };
    info.MagoQwen3VLCaption = {};
    const result = evaluateScriptSetup(info);
    expect(
      result.optional[1].requirements.every(
        (item) => item.status === "installed"
      )
    ).toBe(true);
  });
  it("checks the selected 4B VLM and Q3 text model instead of default variants", () => {
    const result = evaluateScriptSetup(
      {},
      {
        vlmBackend: "qwen3-vl-4b-heretic-int8",
        scriptTextModel: "qwen38-27b-q3"
      }
    );
    expect(
      result.optional[1].requirements.some(
        (item) => item.name === "TextGenerate"
      )
    ).toBe(true);
    expect(
      result.optional[1].requirements.some(
        (item) => item.name === "MagoQwen3VLLoader"
      )
    ).toBe(false);
    expect(
      result.optional[2].requirements.some((item) => item.name === files.llmQ3)
    ).toBe(true);
    expect(
      result.optional[2].requirements.some((item) => item.name === files.llmQ5)
    ).toBe(false);
  });
  it("keeps failed optional probes unverified without blocking readiness", () => {
    const info = installed();
    info.scriptTextInventory = { probeError: true };
    info.SimpleQwenVLggufV2 = { probeError: true };
    const result = evaluateScriptSetup(info);
    expect(result.ready).toBe(true);
    expect(
      result.optional[2].requirements.find((item) => item.name === files.llmQ5)
        ?.status
    ).toBe("unknown");
    expect(
      result.optional[2].requirements.find(
        (item) => item.name === "SimpleQwenVLggufV2"
      )?.status
    ).toBe("unknown");
  });
});

describe("MiniMax H3 VFX LoRAs", () => {
  it("lists every VFX LoRA with its pinned download, without blocking readiness", () => {
    const result = evaluateScriptSetup(installed());
    expect(result.ready).toBe(true);
    expect(result.vfxLoras.map((item) => item.name)).toEqual([
      "minimax_h3_vfx_edit_v1.0_r128.safetensors",
      "minimax_h3_vfx_edit_v1.0_r128_ffp.safetensors",
      "minimax_h3_head_swap_v1.0_r32.safetensors",
      "h3_character_swap_pro4500_1000.safetensors",
      "minimax_h3_style_transfer_v1.0_r64.safetensors"
    ]);
    for (const lora of result.vfxLoras) {
      expect(lora.status).toBe("missing");
      expect(lora.folder).toBe("models/loras/");
      expect(lora.url).toContain(`/resolve/main/`);
      expect(lora.downloadSha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("marks a VFX LoRA installed once ComfyUI lists it", () => {
    const info = installed();
    info.LoraLoaderModelOnly = {
      input: {
        required: {
          lora_name: [
            [hdStepLora, "minimax/minimax_h3_head_swap_v1.0_r32.safetensors"]
          ]
        }
      }
    };
    const headSwap = evaluateScriptSetup(info).vfxLoras.find(
      (item) => item.name === "minimax_h3_head_swap_v1.0_r32.safetensors"
    );
    expect(headSwap?.status).toBe("installed");
  });

  it("tags each per-file setup with its stable id", () => {
    expect(
      evaluateScriptSetup(installed()).optional.map((setup) => setup.id)
    ).toEqual([
      "qwen-image-sheet",
      "vlm-captioning",
      "script-text",
      "flux-klein-4b-sheet",
      "flux-klein-9b-sheet"
    ]);
  });
});
