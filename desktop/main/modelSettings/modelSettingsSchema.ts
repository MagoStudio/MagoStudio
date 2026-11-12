import { z } from "zod";

const MAX_VARIANT_ID_LENGTH = 100;
const MAX_BINDING_KEY_LENGTH = 150;
const MAX_MODEL_FILENAME_LENGTH = 1024;
const MIN_CONTEXT_AND_MAX_BATCH = 2048;
const MAX_CONTEXT_LENGTH = 131072;

const filename = z
  .string()
  .min(1)
  .max(MAX_MODEL_FILENAME_LENGTH)
  .refine(
    (value) =>
      !value.includes("\0") &&
      !/^[\\/]|^[a-z]:|\.\.(?:[\\/]|$)|(?:^|[\\/])\.\./i.test(value) &&
      /\.(gguf|safetensors)$/i.test(value)
  );
export const modelSettingsRequestSchema = z.object({
  model: z.enum(["text", "minimax", "qwen-image", "qwen-edit", "flux"]),
  endpoint: z.string().optional()
});
export const modelPreferencesSchema = z.object({
  variant: z.string().min(1).max(MAX_VARIANT_ID_LENGTH),
  bindings: z.record(z.string().max(MAX_BINDING_KEY_LENGTH), filename),
  encoderDevice: z.enum(["default", "cpu"]),
  tiledDecode: z.boolean(),
  text: z.object({
    mode: z.enum(["auto", "custom", "all", "cpu"]),
    gpuLayers: z.number().int().min(0).max(1000),
    context: z
      .number()
      .int()
      .min(MIN_CONTEXT_AND_MAX_BATCH)
      .max(MAX_CONTEXT_LENGTH),
    batch: z.number().int().min(1).max(MIN_CONTEXT_AND_MAX_BATCH),
    offloadCache: z.boolean(),
    memoryMap: z.boolean()
  })
});
export const modelSettingsMutationSchema = modelSettingsRequestSchema.extend({
  preferences: modelPreferencesSchema,
  memoryPolicy: z.enum(["auto", "low-vram"])
});
export const modelCheckRequestSchema = modelSettingsRequestSchema.extend({
  role: z
    .enum([
      "main",
      "encoder",
      "vae",
      "videoVae",
      "audioVae",
      "accelerator",
      "lora"
    ])
    .optional(),
  filename: filename.optional(),
  action: z.enum(["compatibility", "hash", "runtime", "load", "repair"])
});
