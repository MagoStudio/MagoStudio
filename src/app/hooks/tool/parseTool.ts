export type Tool =
  | "render-video"
  | "edit-frame"
  | "upscale"
  | "mask"
  | "image-to-video";

const TOOL_VALUES: readonly Tool[] = [
  "render-video",
  "edit-frame",
  "upscale",
  "mask",
  "image-to-video"
] as const;

export const DEFAULT_TOOL: Tool = "render-video";

export const parseTool = (value: string | null | undefined): Tool => {
  if (value && (TOOL_VALUES as readonly string[]).includes(value)) {
    return value as Tool;
  }
  return DEFAULT_TOOL;
};
