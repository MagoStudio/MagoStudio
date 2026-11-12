import { describe, expect, it } from "vitest";

import { defaultModelPreferences } from "../../shared/defaultModelPreferences";
import type { EndpointModelSettings } from "../../shared/modelSettings";
import type { ComfyGraph } from "../comfy/comfyGraph";

import { applyModelGraphSettings } from "./applyModelGraphSettings";

describe("applyModelGraphSettings", () => {
  it("loads a custom text file with partial offload and budgets a smaller context without mutating the caller graph", () => {
    const text = defaultModelPreferences("qwen38-27b-q3");
    text.text = {
      ...text.text,
      mode: "custom",
      gpuLayers: 12,
      context: 8192,
      batch: 128,
      memoryMap: true
    };
    const graph: ComfyGraph = {
      "1": {
        class_type: "PrimitiveStringMultiline",
        inputs: {
          value: JSON.stringify({
            model_path: "old.gguf",
            n_gpu_layers: -1,
            n_ctx: 32768,
            max_tokens: 16000,
            verbose: false
          })
        }
      },
      "2": {
        class_type: "SimpleQwenVLggufV2",
        inputs: { config_override: ["1", 0] }
      }
    };
    const next = applyModelGraphSettings(
      graph,
      { models: { text }, memoryPolicy: "auto" },
      "qwen38-27b-q3",
      30,
      "D:/models/custom.gguf"
    );
    expect(JSON.parse(String(next["1"].inputs.value))).toMatchObject({
      model_path: "D:/models/custom.gguf",
      n_gpu_layers: 12,
      n_ctx: 8192,
      n_batch: 128,
      max_tokens: 4096,
      use_mmap: true,
      verbose: false,
      type_k: 8,
      type_v: 8,
      flash_attn_type: 1,
      extra_llama_flash_attn: true
    });
    expect(JSON.parse(String(graph["1"].inputs.value)).n_gpu_layers).toBe(-1);
    const hash = JSON.parse(String(next["1"].inputs.value)).config_hash;
    text.text.gpuLayers = 8;
    expect(
      JSON.parse(
        String(
          applyModelGraphSettings(
            graph,
            { models: { text }, memoryPolicy: "auto" },
            "qwen38-27b-q3",
            30,
            "D:/models/custom.gguf"
          )["1"].inputs.value
        )
      ).config_hash
    ).not.toBe(hash);
  });
  it("uses the computed partial layer count in automatic mode and keeps the cache on CPU in CPU mode", () => {
    const graph: ComfyGraph = {
      a: {
        class_type: "PrimitiveStringMultiline",
        inputs: { value: '{"max_tokens":100}' }
      },
      b: {
        class_type: "SimpleQwenVLggufV2",
        inputs: { config_override: ["a", 0] }
      }
    };
    expect(
      JSON.parse(
        String(
          applyModelGraphSettings(
            graph,
            { models: {}, memoryPolicy: "auto" },
            "qwen38-27b-q3",
            18
          ).a.inputs.value
        )
      ).n_gpu_layers
    ).toBe(18);
    const text = defaultModelPreferences("auto");
    text.text.mode = "cpu";
    expect(
      JSON.parse(
        String(
          applyModelGraphSettings(
            graph,
            { models: { text }, memoryPolicy: "auto" },
            "qwen38-27b-q3",
            18
          ).a.inputs.value
        )
      )
    ).toMatchObject({ n_gpu_layers: 0, offload_kqv: false });
  });
  it("switches the Qwen edit quant, step LoRA and loader together", () => {
    const preferences = defaultModelPreferences("native-int8-8step");
    const graph: ComfyGraph = {
      a: {
        class_type: "UnetLoaderGGUF",
        inputs: { unet_name: "Qwen-Image-Edit-2511-Q5_K_M.gguf" }
      },
      b: {
        class_type: "CLIPLoader",
        inputs: {
          clip_name: "qwen_2.5_vl_7b_fp8_scaled.safetensors",
          type: "qwen_image",
          device: "default"
        }
      },
      c: {
        class_type: "LoraLoaderModelOnly",
        inputs: {
          lora_name:
            "Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors"
        }
      },
      d: { class_type: "KSampler", inputs: { steps: 4 } }
    };
    const next = applyModelGraphSettings(
      graph,
      { models: { "qwen-edit": preferences }, memoryPolicy: "auto" },
      "qwen38-27b-q3",
      0
    );
    expect(next.a).toEqual({
      class_type: "UNETLoader",
      inputs: {
        unet_name: "qwen_image_edit_2511_int8_convrot.safetensors",
        weight_dtype: "default"
      }
    });
    expect(next.c.inputs.lora_name).toContain("8steps");
    expect(next.d.inputs.steps).toBe(8);
  });
  it("does not use the FLUX 4B encoder when the selected profile is 9B", () => {
    const preferences = defaultModelPreferences("flux2-klein-9b-q8");
    const graph: ComfyGraph = {
      a: {
        class_type: "UnetLoaderGGUF",
        inputs: { unet_name: "flux-2-klein-4b-Q8_0.gguf" }
      },
      b: {
        class_type: "CLIPLoader",
        inputs: {
          clip_name: "qwen_3_4b.safetensors",
          type: "flux2",
          device: "default"
        }
      }
    };
    const next = applyModelGraphSettings(
      graph,
      { models: { flux: preferences }, memoryPolicy: "auto" },
      "qwen38-27b-q3",
      0
    );
    expect(next.a.inputs.unet_name).toBe("flux-2-klein-9b-Q8_0.gguf");
    expect(next.b.inputs.clip_name).toBe("qwen_3_8b_fp8mixed.safetensors");
  });
  it("keeps MiniMax audio/video VAEs and image files independent", () => {
    const mini = defaultModelPreferences("int8");
    mini.bindings = {
      "int8:main": "custom-minimax.safetensors",
      "int8:videoVae": "custom-video-vae.safetensors"
    };
    mini.encoderDevice = "cpu";
    const settings: EndpointModelSettings = {
      models: { minimax: mini },
      memoryPolicy: "auto"
    };
    const graph: ComfyGraph = {
      a: {
        class_type: "UNETLoader",
        inputs: {
          unet_name: "minimax_h3_ref2va_pruned_int8_convrot.safetensors"
        }
      },
      b: {
        class_type: "CLIPLoader",
        inputs: {
          clip_name: "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
          type: "minimax",
          device: "default"
        }
      },
      v: {
        class_type: "VAELoader",
        inputs: { vae_name: "minimax_h3_video_vae_fp16.safetensors" }
      },
      x: {
        class_type: "VAELoader",
        inputs: { vae_name: "minimax_h3_audio_vae_fp32.safetensors" }
      }
    };
    const next = applyModelGraphSettings(
      graph,
      settings,
      "qwen38-27b-q3",
      0,
      undefined,
      { encoderCpu: true, tiledDecode: false }
    );
    expect(next.a.inputs.unet_name).toBe("custom-minimax.safetensors");
    expect(next.v.inputs.vae_name).toBe("custom-video-vae.safetensors");
    expect(next.x.inputs.vae_name).toBe(
      "minimax_h3_audio_vae_fp32.safetensors"
    );
    expect(next.b.inputs).toMatchObject({ device: "cpu", type: "minimax" });
    expect(() =>
      applyModelGraphSettings(graph, settings, "qwen38-27b-q3", 0)
    ).toThrow("does not advertise CPU");
  });
  it("only enables tiled decoding for an advertised capability on an image workflow", () => {
    const image = defaultModelPreferences("q5");
    image.tiledDecode = true;
    const graph: ComfyGraph = {
      a: {
        class_type: "UnetLoaderGGUF",
        inputs: { unet_name: "qwen-image-2512-Q5_K_M.gguf" }
      },
      v: {
        class_type: "VAEDecode",
        inputs: { vae: ["vae", 0], samples: ["sample", 0] }
      }
    };
    expect(() =>
      applyModelGraphSettings(
        graph,
        { models: { "qwen-image": image }, memoryPolicy: "auto" },
        "qwen38-27b-q3",
        0
      )
    ).toThrow("Tiled decoding");
    expect(
      applyModelGraphSettings(
        graph,
        { models: { "qwen-image": image }, memoryPolicy: "auto" },
        "qwen38-27b-q3",
        0,
        undefined,
        { encoderCpu: false, tiledDecode: true }
      ).v
    ).toEqual({
      class_type: "VAEDecodeTiled",
      inputs: {
        vae: ["vae", 0],
        samples: ["sample", 0],
        tile_size: 512,
        overlap: 64
      }
    });
  });
  it("applies MiniMax overrides to Singularity/Heretic workflows without replacing their defaults implicitly", () => {
    const graph: ComfyGraph = {
      main: {
        class_type: "UNETLoader",
        inputs: {
          unet_name:
            "Minimax-h3_Singularity_ref2va_Pruned_v1.3_int8.safetensors",
          weight_dtype: "default"
        }
      },
      encoder: {
        class_type: "CLIPLoader",
        inputs: {
          clip_name:
            "qwen3vl_32b_h3_ultra_uncensored_heretic_int8_convrot.safetensors",
          type: "minimax"
        }
      },
      lora: {
        class_type: "LoraLoaderModelOnly",
        inputs: { lora_name: "robert-taomate_h3_3step_comfy.safetensors" }
      }
    };
    const settings: EndpointModelSettings = {
      models: {},
      memoryPolicy: "auto"
    };
    expect(
      applyModelGraphSettings(graph, settings, "qwen38-27b-q3", 0)
    ).toEqual(graph);
    const preferences = defaultModelPreferences("int8");
    preferences.bindings = {
      "int8:main": "custom.gguf",
      "int8:encoder": "custom-encoder.safetensors",
      "int8:lora": "custom-lora.safetensors"
    };
    settings.models.minimax = preferences;
    const next = applyModelGraphSettings(graph, settings, "qwen38-27b-q3", 0);
    expect(next.main).toMatchObject({
      class_type: "UnetLoaderGGUF",
      inputs: { unet_name: "custom.gguf" }
    });
    expect(next.main.inputs).not.toHaveProperty("weight_dtype");
    expect(next.encoder.inputs.clip_name).toBe("custom-encoder.safetensors");
    expect(next.lora.inputs.lora_name).toBe("custom-lora.safetensors");
  });
});
