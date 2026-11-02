import type { AssetPromptResponse } from "@hooks/assets/interface";

export const formatPromptFromResponse = (
  promptResponse: AssetPromptResponse
): string => {
  const { content, setting, style } = promptResponse.prompt.positive;
  return [content, setting, style].filter(Boolean).join("\n\n");
};
