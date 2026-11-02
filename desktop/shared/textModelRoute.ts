import type { LocalTextModelProvider } from "./contracts";

export type TextModelRoute = "local" | "cloud";

/**
 * The one place that decides where a text-LLM call runs. Mago cloud is used
 * only when it is both chosen and reachable — signed out, "cloud" falls back
 * to the local model rather than leaving the feature unusable.
 *
 * Shared by Optimize prompt and the renderer worker for desktop script
 * casting, shot prompts and chat, so every caller agrees.
 */
export const resolveTextModelRoute = ({
  provider,
  isCloudAccountActive
}: {
  provider: LocalTextModelProvider;
  isCloudAccountActive: boolean;
}): TextModelRoute =>
  provider === "cloud" && isCloudAccountActive ? "cloud" : "local";
