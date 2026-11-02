import type { LocalVlmBackend } from "../../shared/contracts";
import { asRecord } from "../comfy/asRecord";
import { ComfyClient } from "../comfy/ComfyClient";
import type { ComfyGraph } from "../comfy/comfyGraph";

import {
  QWEN3_VL_MODEL_ALTERNATIVES,
  QWEN3_VL_MODEL_FILES,
  QWEN3_VL_HERETIC_MODEL_FILE,
  resolveModelFile
} from "./vlmModelFiles";

const MAX_IMAGES = 4;
const RANDOM_SEED_BITS = 32;

/** Node ids in the graph built below. The caption node's id is the key we read
 *  the generated text back out of /history under. */
const LOADER_NODE_ID = "1";
const CAPTION_NODE_ID = "2";
const FIRST_IMAGE_NODE_ID = 10;
const FIRST_BATCH_NODE_ID = 20;

const LOADER_CLASS = "MagoQwen3VLLoader";
const CAPTION_CLASS = "MagoQwen3VLCaption";
const NATIVE_LOADER_CLASS = "CLIPLoader";
const NATIVE_GENERATE_CLASS = "TextGenerate";
const NATIVE_OUTPUT_CLASS = "PreviewAny";
const NATIVE_OUTPUT_NODE_ID = "3";

/**
 * Poll budget. A caption itself is a few seconds, but the first request after
 * ComfyUI starts loads a ~2.3 GB GGUF (and may start a llama-server), which can
 * take a minute or more on a cold disk.
 */
const POLL_TIMEOUT_MS = 300_000;
const POLL_INTERVAL_MS = 1_000;

const DEFAULT_MAX_TOKENS = 1_024;
const DEFAULT_TEMPERATURE = 0.6;
const DEFAULT_TOP_P = 0.9;
const DEFAULT_N_CTX = 16_384;
/** -1 offloads every layer to the GPU. */
const GPU_LAYERS_ALL = -1;

export type VlmModelStatus = {
  installed: boolean;
  /** The exact ComfyUI combo values to use, when installed. */
  gguf: string | null;
  mmproj: string | null;
  safetensors: string | null;
  /** Basenames the user still needs to place, when not installed. */
  missing: string[];
};

export type VlmPollResult =
  | { state: "queued" | "running" }
  | { state: "finished"; text: string }
  | { state: "error"; message: string };

export type VlmRequest = {
  systemPrompt: string;
  userPrompt: string;
  /** PNG/JPEG bytes, at most four, in the order the prompt refers to them. */
  images?: Buffer[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  nCtx?: number;
  /** Omit to get a random one — see the seed note in submit(). */
  seed?: number;
};

/**
 * ComfyUI client for the MagoQwen3VL nodes.
 *
 * Deliberately a sibling of ComfyQwenClient rather than a subclass: it shares
 * the endpoint normalisation and the /prompt + /history + /queue protocol, but
 * every payload differs (in-memory images instead of file paths, text instead
 * of image bytes, a minutes-long rather than seconds-long completion budget).
 */
export class ComfyVlmClient {
  readonly endpoint: string;
  private readonly comfy: ComfyClient;

  constructor(
    endpoint: string,
    private readonly backend: LocalVlmBackend = "qwen3-vl-2b-gguf",
    comfy?: ComfyClient
  ) {
    this.comfy = comfy ?? new ComfyClient(endpoint);
    this.endpoint = this.comfy.endpoint;
  }

  /** Are the selected backend's nodes installed and weights in place? */
  async probeModels(): Promise<VlmModelStatus> {
    if (this.backend === "qwen3-vl-4b-heretic-int8")
      return this.probeNativeModels();
    const info = await this.comfy.getJson(
      `/object_info/${encodeURIComponent(LOADER_CLASS)}`
    );
    const node = asRecord(info[LOADER_CLASS]);
    if (!node)
      throw new Error(
        `ComfyUI has no ${LOADER_CLASS} node — install ComfyUI-MagoNodes`
      );
    const available = this.comboValues(node, "gguf_name");
    const gguf = resolveModelFile(
      available,
      QWEN3_VL_MODEL_FILES.gguf,
      QWEN3_VL_MODEL_ALTERNATIVES.gguf
    );
    const mmproj = resolveModelFile(
      this.comboValues(node, "mmproj_name"),
      QWEN3_VL_MODEL_FILES.mmproj,
      QWEN3_VL_MODEL_ALTERNATIVES.mmproj
    );
    const missing: string[] = [];
    if (!gguf) missing.push(QWEN3_VL_MODEL_FILES.gguf);
    if (!mmproj) missing.push(QWEN3_VL_MODEL_FILES.mmproj);
    return {
      installed: missing.length === 0,
      gguf,
      mmproj,
      safetensors: null,
      missing
    };
  }

  private async probeNativeModels(): Promise<VlmModelStatus> {
    const loaderInfo = await this.comfy.getJson(
      `/object_info/${encodeURIComponent(NATIVE_LOADER_CLASS)}`
    );
    const loader = asRecord(loaderInfo[NATIVE_LOADER_CLASS]);
    if (!loader)
      throw new Error(
        "ComfyUI has no CLIPLoader node — update ComfyUI to use the native Qwen3-VL model"
      );

    for (const nodeClass of [NATIVE_GENERATE_CLASS, NATIVE_OUTPUT_CLASS]) {
      const info = await this.comfy.getJson(
        `/object_info/${encodeURIComponent(nodeClass)}`
      );
      if (!asRecord(info[nodeClass]))
        throw new Error(
          `ComfyUI has no ${nodeClass} node — update ComfyUI to use the native Qwen3-VL model`
        );
    }

    const safetensors = resolveModelFile(
      this.comboValues(loader, "clip_name"),
      QWEN3_VL_HERETIC_MODEL_FILE,
      []
    );
    return {
      installed: Boolean(safetensors),
      gguf: null,
      mmproj: null,
      safetensors,
      missing: safetensors ? [] : [QWEN3_VL_HERETIC_MODEL_FILE]
    };
  }

  /** Submit a caption request and wait for the generated text. */
  async generate(request: VlmRequest): Promise<string> {
    const models = await this.probeModels();
    if (this.backend === "qwen3-vl-4b-heretic-int8") {
      if (!models.installed || !models.safetensors)
        throw new Error(
          `ComfyUI is missing the Qwen3-VL weights: ${models.missing.join(", ")}`
        );
      const promptId = await this.submitNative(request, models.safetensors);
      return this.awaitText(promptId);
    }
    if (!models.installed || !models.gguf || !models.mmproj)
      throw new Error(
        `ComfyUI is missing the Qwen3-VL weights: ${models.missing.join(", ")}`
      );
    const promptId = await this.submit(request, models.gguf, models.mmproj);
    return this.awaitText(promptId);
  }

  private async submitNative(
    request: VlmRequest,
    safetensors: string
  ): Promise<string> {
    const images = (request.images ?? []).slice(0, MAX_IMAGES);
    const uploaded = await Promise.all(
      images.map((bytes, index) =>
        this.comfy.uploadBytes(bytes, "image/png", ".png")
      )
    );
    return this.comfy.submitGraph(
      this.buildNativeGraph({
        safetensors,
        images: uploaded,
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        maxTokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: request.temperature ?? DEFAULT_TEMPERATURE,
        topP: request.topP ?? DEFAULT_TOP_P,
        seed: Number.isSafeInteger(request.seed)
          ? request.seed!
          : Math.floor(Math.random() * 2 ** RANDOM_SEED_BITS)
      })
    );
  }

  private async submit(
    request: VlmRequest,
    gguf: string,
    mmproj: string
  ): Promise<string> {
    const images = (request.images ?? []).slice(0, MAX_IMAGES);
    const uploaded = await Promise.all(
      images.map((bytes, index) =>
        this.comfy.uploadBytes(bytes, "image/png", ".png")
      )
    );
    return this.comfy.submitGraph(
      this.buildGraph({
        gguf,
        mmproj,
        images: uploaded,
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        maxTokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: request.temperature ?? DEFAULT_TEMPERATURE,
        topP: request.topP ?? DEFAULT_TOP_P,
        nCtx: request.nCtx ?? DEFAULT_N_CTX,
        // A fresh seed per request by default: an identical graph is served from
        // ComfyUI's execution cache, which would hand back the previous caption.
        seed: Number.isSafeInteger(request.seed)
          ? request.seed!
          : Math.floor(Math.random() * 2 ** RANDOM_SEED_BITS)
      })
    );
  }

  private async awaitText(promptId: string): Promise<string> {
    const outcome = await this.comfy.waitForPrompt(promptId, {
      timeoutMs: POLL_TIMEOUT_MS,
      pollIntervalMs: POLL_INTERVAL_MS
    });
    if (outcome.kind !== "finished") {
      await this.cancel(promptId).catch(() => undefined);
      throw new Error("ComfyUI did not return a caption in time");
    }
    return this.textFromOutputs(outcome.outputs);
  }

  async poll(promptId: string): Promise<VlmPollResult> {
    const status = await this.comfy.readPromptStatus(promptId);
    if (status.state !== "finished") return status;
    try {
      return { state: "finished", text: this.textFromOutputs(status.outputs) };
    } catch (error) {
      return {
        state: "error",
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private textFromOutputs(outputs: Record<string, unknown>): string {
    const outputNodeId =
      this.backend === "qwen3-vl-4b-heretic-int8"
        ? NATIVE_OUTPUT_NODE_ID
        : CAPTION_NODE_ID;
    const output = asRecord(outputs[outputNodeId]);
    const text = Array.isArray(output?.text) ? output.text[0] : undefined;
    const cleanedText =
      typeof text === "string"
        ? this.backend === "qwen3-vl-4b-heretic-int8"
          ? text.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, "").trim()
          : text.trim()
        : "";
    if (!cleanedText)
      throw new Error("ComfyUI completed without any generated text");
    return cleanedText;
  }

  async cancel(promptId: string): Promise<void> {
    await this.comfy.removeFromQueueIfPending(promptId);
  }

  private buildGraph({
    gguf,
    mmproj,
    images,
    systemPrompt,
    userPrompt,
    maxTokens,
    temperature,
    topP,
    nCtx,
    seed
  }: {
    gguf: string;
    mmproj: string;
    images: string[];
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
    temperature: number;
    topP: number;
    nCtx: number;
    seed: number;
  }): ComfyGraph {
    const graph: Record<
      string,
      { class_type: string; inputs: Record<string, unknown> }
    > = {
      [LOADER_NODE_ID]: {
        class_type: LOADER_CLASS,
        inputs: {
          gguf_name: gguf,
          mmproj_name: mmproj,
          n_ctx: nCtx,
          n_gpu_layers: GPU_LAYERS_ALL
        }
      }
    };
    const imageInputs: Record<string, unknown> = {};
    images.forEach((image, index) => {
      const id = String(FIRST_IMAGE_NODE_ID + index);
      graph[id] = { class_type: "LoadImage", inputs: { image } };
      imageInputs[`image${index + 1}`] = [id, 0];
    });
    graph[CAPTION_NODE_ID] = {
      class_type: CAPTION_CLASS,
      inputs: {
        vlm: [LOADER_NODE_ID, 0],
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        seed: Math.max(0, seed),
        ...imageInputs
      }
    };
    return graph;
  }

  private buildNativeGraph({
    safetensors,
    images,
    systemPrompt,
    userPrompt,
    maxTokens,
    temperature,
    topP,
    seed
  }: {
    safetensors: string;
    images: string[];
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
    temperature: number;
    topP: number;
    seed: number;
  }): ComfyGraph {
    const graph: Record<
      string,
      { class_type: string; inputs: Record<string, unknown> }
    > = {
      [LOADER_NODE_ID]: {
        class_type: NATIVE_LOADER_CLASS,
        inputs: { clip_name: safetensors, type: "stable_diffusion" }
      }
    };

    const loadedImages: [string, number][] = [];
    images.forEach((image, index) => {
      const id = String(FIRST_IMAGE_NODE_ID + index);
      graph[id] = { class_type: "LoadImage", inputs: { image } };
      loadedImages.push([id, 0]);
    });

    let imageInput: [string, number] | undefined = loadedImages[0];
    for (let index = 1; index < loadedImages.length; index += 1) {
      const id = String(FIRST_BATCH_NODE_ID + index - 1);
      graph[id] = {
        class_type: "ImageBatch",
        inputs: { image1: imageInput, image2: loadedImages[index] }
      };
      imageInput = [id, 0];
    }

    // ComfyUI's Qwen3-VL tokenizer inserts one vision block per image in the
    // batch and wraps this text in the model's own chat template. This Heretic
    // checkpoint immediately emits EOS when given the no-think prefix, so let
    // it use its normal generation path and strip any reasoning in poll().
    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    graph[CAPTION_NODE_ID] = {
      class_type: NATIVE_GENERATE_CLASS,
      inputs: {
        clip: [LOADER_NODE_ID, 0],
        prompt,
        max_length: maxTokens,
        sampling_mode: temperature === 0 ? "off" : "on",
        ...(temperature === 0
          ? {}
          : {
              "sampling_mode.temperature": temperature,
              "sampling_mode.top_k": 50,
              "sampling_mode.top_p": topP,
              "sampling_mode.min_p": 0,
              "sampling_mode.repetition_penalty": 1,
              "sampling_mode.presence_penalty": 0,
              "sampling_mode.seed": Math.max(0, seed)
            }),
        thinking: true,
        use_default_template: true,
        ...(imageInput ? { image: imageInput } : {})
      }
    };
    graph[NATIVE_OUTPUT_NODE_ID] = {
      class_type: NATIVE_OUTPUT_CLASS,
      inputs: { source: [CAPTION_NODE_ID, 0] }
    };
    return graph;
  }

  private comboValues(
    node: Record<string, unknown>,
    inputName: string
  ): string[] {
    const required = asRecord(asRecord(node.input)?.required);
    const spec = required?.[inputName];
    const values = Array.isArray(spec) ? spec[0] : undefined;
    return Array.isArray(values)
      ? values.filter((value): value is string => typeof value === "string")
      : [];
  }
}
