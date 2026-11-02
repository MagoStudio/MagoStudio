export interface EnhancePromptRequestBody {
  query: string;
  version?: "img2img_kontext";
}

export interface EnhancedPrompt {
  enhanced_prompt: string;
}

export interface AdaptI2vPromptRequestBody {
  prompt: string;
  reference_asset_ids?: string[];
  engine?: string;
  duration_s?: number;
  aspect?: string;
}

export interface AdaptedI2vPrompt {
  adapted_prompt: string;
  adapted: boolean;
  engine?: string;
  label_warnings?: string[];
  reference_inventory?: string;
}
