import { defaultModelPreferences } from "../../shared/defaultModelPreferences";
import { LOCAL_MODEL_DEFINITIONS } from "../../shared/localModelDefinitions";
import type { EndpointModelSettings } from "../../shared/modelSettings";
import { resolveModelVariant } from "../../shared/resolveModelVariant";
import { asRecord } from "../comfy/asRecord";
import type { ComfyGraph } from "../comfy/comfyGraph";

const DEFAULT_MICRO_BATCH = 512;
const TEXT_MICRO_BATCH_LIMIT = 1024;
const GGML_TYPE_Q8_0 = 8;
const LLAMA_FLASH_ATTN_TYPE_ENABLED = 1;
const DEFAULT_RESPONSE_BUDGET = 1024;

export const applyModelGraphSettings = (
  graph: ComfyGraph,
  settings: EndpointModelSettings,
  setupTextVariant: string,
  textLayers: number,
  textPath?: string,
  capabilities?: {
    encoderCpu: boolean;
    tiledDecode: boolean;
    tiledDecodeInputs?: Record<string, unknown>;
  }
): ComfyGraph => {
  const result = structuredClone(graph);
  const nodes = Object.values(result);
  for (const definition of LOCAL_MODEL_DEFINITIONS) {
    if (definition.runtime === "llama") continue;
    const original = definition.variants.find((variant) =>
      variant.components.some(
        (component) =>
          component.role === "main" &&
          nodes.some((node) =>
            [
              component.filename,
              ...(component.workflowFilenames ?? [])
            ].includes(String(node.inputs[component.input]))
          )
      )
    );
    if (!original) continue;
    const preferences =
      settings.models[definition.id] ??
      defaultModelPreferences(definition.defaultVariant);
    const selected = resolveModelVariant(
      definition,
      preferences,
      setupTextVariant,
      original.id
    );
    for (const node of nodes) {
      const source = original.components.find(
        (component) =>
          node.class_type === component.loader &&
          [component.filename, ...(component.workflowFilenames ?? [])].includes(
            String(node.inputs[component.input])
          )
      );
      if (!source) continue;
      const replacement = selected.components.find(
        (component) => component.role === source.role
      )!;
      const filename =
        preferences.bindings[`${selected.id}:${replacement.role}`] ??
        (selected.id === original.id
          ? String(node.inputs[source.input])
          : replacement.filename);
      node.inputs[replacement.input] = filename;
      if (replacement.role === "main") {
        const gguf = filename.toLowerCase().endsWith(".gguf");
        node.class_type = gguf ? "UnetLoaderGGUF" : "UNETLoader";
        if (gguf) delete node.inputs.weight_dtype;
        else node.inputs.weight_dtype = "default";
      }
      if (replacement.clipType) node.inputs.type = replacement.clipType;
      if (
        replacement.role === "encoder" &&
        preferences.encoderDevice === "cpu"
      ) {
        if (!capabilities?.encoderCpu)
          throw new Error(
            "This ComfyUI loader does not advertise CPU text encoding. Check the installation before selecting this device."
          );
        node.inputs.device = "cpu";
      }
    }
    if (selected.steps && selected.id !== original.id)
      for (const node of nodes)
        if (node.class_type === "KSampler") node.inputs.steps = selected.steps;
    if (preferences.tiledDecode) {
      if (!definition.supportsTiledDecode || !capabilities?.tiledDecode)
        throw new Error(
          "Tiled decoding is unavailable in this ComfyUI installation."
        );
      for (const node of nodes)
        if (node.class_type === "VAEDecode") {
          node.class_type = "VAEDecodeTiled";
          node.inputs = { ...capabilities.tiledDecodeInputs, ...node.inputs };
          node.inputs.tile_size = DEFAULT_MICRO_BATCH;
          node.inputs.overlap = 64;
        }
    }
  }
  const text = settings.models.text ?? defaultModelPreferences("auto");
  for (const node of nodes) {
    if (node.class_type !== "SimpleQwenVLggufV2") continue;
    const link = node.inputs.config_override;
    const configNode =
      Array.isArray(link) && typeof link[0] === "string"
        ? result[link[0]]
        : undefined;
    const raw = configNode?.inputs.value;
    if (typeof raw !== "string") continue;
    const config = asRecord(JSON.parse(raw));
    if (!config) throw new Error("Invalid local text model configuration");
    if (textPath) config.model_path = textPath;
    config.n_gpu_layers =
      text.text.mode === "cpu"
        ? 0
        : text.text.mode === "all"
          ? -1
          : text.text.mode === "custom"
            ? text.text.gpuLayers
            : textLayers;
    config.n_ctx = text.text.context;
    config.n_batch = text.text.batch;
    config.n_ubatch = Math.min(text.text.batch, TEXT_MICRO_BATCH_LIMIT);
    config.offload_kqv =
      config.n_gpu_layers === 0 ? false : text.text.offloadCache;
    config.use_mmap = text.text.memoryMap;
    config.type_k = GGML_TYPE_Q8_0;
    config.type_v = GGML_TYPE_Q8_0;
    config.flash_attn_type = LLAMA_FLASH_ATTN_TYPE_ENABLED;
    config.extra_llama_flash_attn = true;
    config.config_hash = JSON.stringify({
      model: config.model_path,
      layers: config.n_gpu_layers,
      context: config.n_ctx,
      batch: config.n_batch,
      microBatch: config.n_ubatch,
      cache: config.offload_kqv,
      cacheType: config.type_k,
      flashAttention: config.flash_attn_type,
      mmap: config.use_mmap
    });
    config.max_tokens = Math.min(
      Number(config.max_tokens) || DEFAULT_RESPONSE_BUDGET,
      Math.floor(text.text.context / 2)
    );
    configNode!.inputs.value = JSON.stringify(config);
  }
  return result;
};
