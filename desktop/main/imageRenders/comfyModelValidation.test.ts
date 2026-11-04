import { afterEach, describe, expect, it, vi } from "vitest";

import { MINIMAX_H3_STEP_LORAS } from "../../shared/minimaxH3StepLoras";

import {
  LTX_UPSCALE_MODEL_FILES,
  ltxUpscaleLoraFile
} from "./comfyLtxUpscaleClient";
import { MINIMAX_H3_LOCAL_MODEL_FILES } from "./comfyMiniMaxH3Client";
import {
  COMFY_RENDER_MODEL_NAMES,
  probeComfyRenderModel
} from "./comfyModelValidation";
import {
  FLUX2_KLEIN_MODEL_FILES,
  QWEN_MODEL_FILES,
  QWEN_Q5_4STEP_MODEL_FILES
} from "./comfyQwenClient";
import {
  MAGO_ANIMATE_MODEL_FILES,
  WAN_ANIMATE_MODEL_FILES,
  WAN_FUN_CONTROL_MODEL_FILES,
  WAN_VACE_MODEL_FILES,
  magoAnimateUnetFile,
  resolveWanFunUnetFiles
} from "./comfyWanAnimateClient";

const installedFiles = [
  ...Object.values(QWEN_MODEL_FILES),
  ...Object.values(QWEN_Q5_4STEP_MODEL_FILES),
  ...Object.values(FLUX2_KLEIN_MODEL_FILES["flux2-klein-4b-q8"]),
  FLUX2_KLEIN_MODEL_FILES["flux2-klein-9b-q8"].unet,
  FLUX2_KLEIN_MODEL_FILES["flux2-klein-9b-q8"].vae,
  ...Object.values(WAN_ANIMATE_MODEL_FILES),
  ...Object.values(WAN_VACE_MODEL_FILES),
  ...Object.values(WAN_FUN_CONTROL_MODEL_FILES),
  ...Object.values(MAGO_ANIMATE_MODEL_FILES),
  ...Object.values(LTX_UPSCALE_MODEL_FILES),
  ...Object.values(MINIMAX_H3_LOCAL_MODEL_FILES),
  ...Object.values(MINIMAX_H3_STEP_LORAS).map((stepLora) => stepLora.loraFile),
  ...Object.values(resolveWanFunUnetFiles("fp8_scaled")).filter(
    (value): value is string => typeof value === "string"
  ),
  magoAnimateUnetFile("Q4_K_M"),
  ltxUpscaleLoraFile(4)
];

const nodePayload = (nodeName: string, files = installedFiles) => ({
  [nodeName]: {
    input: {
      required: Object.fromEntries(
        [
          "unet_name",
          "clip_name",
          "clip_name1",
          "clip_name2",
          "vae_name",
          "lora_name"
        ].map((input) => [input, [files]])
      )
    }
  }
});

const comboNodePayload = (nodeName: string, files: string[]) => ({
  [nodeName]: {
    input: {
      required: {
        lora_name: ["COMBO", { multiselect: false, options: files }]
      }
    }
  }
});

const requestedNodeName = (url: string | URL | Request): string => {
  const value =
    typeof url === "string" ? url : url instanceof URL ? url.href : url.url;
  return decodeURIComponent(value.split("/").at(-1)!);
};

describe("probeComfyRenderModel", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("checks every supported Comfy render model", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const nodeName = requestedNodeName(url);
        return Response.json(nodePayload(nodeName));
      })
    );

    for (const model of COMFY_RENDER_MODEL_NAMES) {
      await expect(
        probeComfyRenderModel("http://127.0.0.1:8188", model)
      ).resolves.toMatchObject({ model, ready: true });
    }
  });

  it("reports missing nodes and model files", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const nodeName = requestedNodeName(url);
        if (nodeName === "CFGNorm") return Response.json({});
        return Response.json(nodePayload(nodeName, []));
      })
    );

    await expect(
      probeComfyRenderModel("http://127.0.0.1:8188", "qwen")
    ).resolves.toMatchObject({
      ready: false,
      missingNodes: ["CFGNorm"],
      missingModels: Object.values(QWEN_Q5_4STEP_MODEL_FILES)
    });
  });

  it.each([
    ["hd", MINIMAX_H3_STEP_LORAS[8].loraFile],
    ["turbo", MINIMAX_H3_STEP_LORAS[4].loraFile],
    ["draft", MINIMAX_H3_STEP_LORAS[2].loraFile]
  ])(
    "requires the step LoRA for %s MiniMax H3",
    async (h3Quality, stepLoraFile) => {
      const filesWithoutStepLora = installedFiles.filter(
        (file) => file !== stepLoraFile
      );
      const requestedNodeNames: string[] = [];
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string | URL | Request) => {
          const nodeName = requestedNodeName(url);
          requestedNodeNames.push(nodeName);
          return Response.json(nodePayload(nodeName, filesWithoutStepLora));
        })
      );

      await expect(
        probeComfyRenderModel("http://127.0.0.1:8188", "minimax_h3_local", {
          h3_quality: h3Quality
        })
      ).resolves.toMatchObject({
        ready: false,
        missingNodes: [],
        missingModels: [stepLoraFile]
      });
      expect(requestedNodeNames).toContain("BasicScheduler");
      expect(requestedNodeNames).toContain("LoraLoaderModelOnly");
      expect(requestedNodeNames).not.toContain("MiniMaxH3PDDAccApply");
    }
  );

  it("falls back to the HD step LoRA for a legacy high quality", async () => {
    const filesWithoutHdStepLora = installedFiles.filter(
      (file) => file !== MINIMAX_H3_STEP_LORAS[8].loraFile
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) =>
        Response.json(
          nodePayload(requestedNodeName(url), filesWithoutHdStepLora)
        )
      )
    );

    await expect(
      probeComfyRenderModel("http://127.0.0.1:8188", "minimax_h3_local", {
        h3_quality: "high"
      })
    ).resolves.toMatchObject({
      ready: false,
      missingModels: [MINIMAX_H3_STEP_LORAS[8].loraFile]
    });
  });

  it("requires the VFX LoRA and the guide node in a guided VFX mode", async () => {
    const requestedNodeNames: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const nodeName = requestedNodeName(url);
        requestedNodeNames.push(nodeName);
        return Response.json(nodePayload(nodeName, installedFiles));
      })
    );

    await expect(
      probeComfyRenderModel("http://127.0.0.1:8188", "minimax_h3_local", {
        h3_quality: "hd",
        vfx_mode: "vfx_edit",
        vfx_edited_frame_id: "edited"
      })
    ).resolves.toMatchObject({
      ready: false,
      missingModels: ["minimax_h3_vfx_edit_v1.0_r128_ffp.safetensors"]
    });
    expect(requestedNodeNames).toContain("MiniMaxH3AddGuide");
    expect(requestedNodeNames).toContain("LoraLoaderModelOnly");
  });

  it("skips the guide node when the VFX mode keeps the source as a reference", async () => {
    const requestedNodeNames: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const nodeName = requestedNodeName(url);
        requestedNodeNames.push(nodeName);
        return Response.json(nodePayload(nodeName, installedFiles));
      })
    );

    await expect(
      probeComfyRenderModel("http://127.0.0.1:8188", "minimax_h3_local", {
        h3_quality: "hd",
        vfx_mode: "character_swap"
      })
    ).resolves.toMatchObject({
      missingModels: ["h3_character_swap_pro4500_1000.safetensors"]
    });
    expect(requestedNodeNames).not.toContain("MiniMaxH3AddGuide");
  });

  it("validates the selected Q5 four-step Qwen setup", async () => {
    const alternativeFiles = [
      ...installedFiles,
      ...Object.values(QWEN_Q5_4STEP_MODEL_FILES)
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const nodeName = requestedNodeName(url);
        return Response.json(nodePayload(nodeName, alternativeFiles));
      })
    );

    await expect(
      probeComfyRenderModel("http://127.0.0.1:8188", "qwen", {
        qwen_image_edit_setup: "gguf-q5-4step"
      })
    ).resolves.toMatchObject({ ready: true, missingModels: [] });
  });

  it("validates Flux 2 Klein files for the selected local setup", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const nodeName = requestedNodeName(url);
        return Response.json(nodePayload(nodeName));
      })
    );

    await expect(
      probeComfyRenderModel("http://127.0.0.1:8188", "qwen", {
        qwen_image_edit_setup: "flux2-klein-4b-q8"
      })
    ).resolves.toMatchObject({ ready: true, missingModels: [] });

    await expect(
      probeComfyRenderModel("http://127.0.0.1:8188", "qwen", {
        qwen_image_edit_setup: "flux2-klein-9b-q8"
      })
    ).resolves.toMatchObject({
      ready: false,
      missingModels: [FLUX2_KLEIN_MODEL_FILES["flux2-klein-9b-q8"].clip]
    });
  });

  it("reads options from custom nodes using ComfyUI's COMBO schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const nodeName = requestedNodeName(url);
        if (nodeName === "LTXICLoRALoaderModelOnly")
          return Response.json(
            comboNodePayload(nodeName, [ltxUpscaleLoraFile(4)])
          );
        return Response.json(nodePayload(nodeName));
      })
    );

    await expect(
      probeComfyRenderModel(
        "http://127.0.0.1:8188",
        "ltx_2_3_spatial_upscaler",
        { ltx_upscale_factor: "4" }
      )
    ).resolves.toMatchObject({ ready: true, missingModels: [] });
  });
});
