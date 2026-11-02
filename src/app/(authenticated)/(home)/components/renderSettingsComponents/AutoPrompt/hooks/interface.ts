import { ImageAssetResponse } from "@domains/asset/interface";
import { AssetPromptResponse } from "@hooks/assets/interface";

export interface GenerateAutoPromptParams {
  styleReferenceImageUrl: string;
  sourceVideoFrameUrl?: string;
  motionDescription?: string;
  version?: AutoPromptVersion;
}

export interface AutoPromptApiResponse {
  positive_prompt: string;
}

export interface AutoPromptRequestBody {
  apiRequestData: {
    imageUrls: {
      url: string;
      type: "sourceVideoFrame" | "styleReferenceImage";
    }[];
    motionDescription?: string;
  };
  version: AutoPromptVersion;
}

export interface UseAutoPromptParams {
  motionDescription?: string;
  sourceVideoFrameBase64?: string | null;
  styleReferenceImageBase64?: string | null;
  styleReferenceImageId?: string;
  version: AutoPromptVersion;
  videoAssetId?: string;
  onAutoPromptGenerated?: (prompt: string) => void;
}

export interface UseExistingAutoPromptParams {
  styleReferenceImageId?: string;
  version: AutoPromptVersion;
  videoAssetId?: string;
}

export interface UseExistingAutoPromptResult {
  existingPrompt: string | null;
  existingPromptResponse: AssetPromptResponse | null;
  imageAsset?: ImageAssetResponse;
  isPending: boolean;
}

export type AutoPromptVersion = "img2img_mago" | "video2video_default";
