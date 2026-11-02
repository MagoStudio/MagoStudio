/**
 * The Qwen3-VL weights the local VLM features expect in ComfyUI.
 *
 * Basenames only. `folder_paths.get_filename_list` returns paths relative to
 * `ComfyUI/models/LLM` using the host's separator, so the combo value for a
 * file in `models/LLM/GGUF/` is `GGUF\\x.gguf` on Windows and `GGUF/x.gguf`
 * elsewhere. Rather than guess, ComfyVlmClient.probeModels reads the real combo
 * values from /object_info and matches them on basename.
 *
 * Mirrors QWEN_MODEL_FILES in ../imageRenders/comfyQwenClient.ts.
 */
export const QWEN3_VL_MODEL_FILES = {
  gguf: "Qwen3-VL-2B-Instruct-UD-Q8_K_XL.gguf",
  mmproj: "mmproj-BF16.gguf"
} as const;

/** Accepted alternatives, in preference order, if the primary isn't present. */
export const QWEN3_VL_MODEL_ALTERNATIVES = {
  gguf: ["Qwen3-VL-2B-Instruct-Q8_0.gguf"],
  mmproj: ["mmproj-F16.gguf", "mmproj-F32.gguf"]
} as const;

export const QWEN3_VL_MODEL_SOURCE =
  "https://huggingface.co/unsloth/Qwen3-VL-2B-Instruct-GGUF";

export const QWEN3_VL_HERETIC_MODEL_FILE =
  "qwen3-vl-4b-heretic_int8_dynamic_convrot.safetensors";

export const QWEN3_VL_HERETIC_MODEL_SOURCE =
  "https://huggingface.co/ethanfel/Qwen3-VL-4B-Heretic-ComfyUI-ConvRot-INT8";

const basename = (value: string): string =>
  value.split(/[\\/]/).pop()?.toLowerCase() ?? "";

/**
 * Resolve the exact ComfyUI combo value for a wanted basename, preferring the
 * primary file and falling back through the documented alternatives.
 */
export const resolveModelFile = (
  available: string[],
  wanted: string,
  alternatives: readonly string[]
): string | null => {
  for (const candidate of [wanted, ...alternatives]) {
    const match = available.find(
      (entry) => basename(entry) === candidate.toLowerCase()
    );
    if (match) return match;
  }
  return null;
};
