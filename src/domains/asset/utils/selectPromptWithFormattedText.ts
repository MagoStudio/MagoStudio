import { AssetPromptResponse } from "@hooks/assets/interface";

import { FormattedAssetPromptResponse } from "../data/types";

export const selectPromptWithFormattedText = (
  data: AssetPromptResponse | undefined
): FormattedAssetPromptResponse | undefined => {
  if (!data) return undefined;

  if (typeof data.prompt === "string") {
    return {
      prompt: data.prompt,
      formattedText: data.prompt
    };
  }

  if (!data.prompt?.positive) {
    return {
      prompt: data.prompt,
      formattedText: ""
    };
  }

  const { content, setting, style } = data.prompt.positive;
  const parts = [content, setting, style];

  return {
    prompt: data.prompt,
    formattedText: parts.filter(Boolean).join("\n")
  };
};
