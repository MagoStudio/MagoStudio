import { AssetPromptResponse } from "@hooks/assets/interface";

export type FormattedAssetPromptResponse = {
  prompt: AssetPromptResponse["prompt"];
  formattedText: string;
};
