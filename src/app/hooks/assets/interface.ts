import { Layer } from "@schemas/layer";

export interface VideoAssetCreationData {
  timeline: {
    id: string;
    layers: Layer[];
    name: string;
    project_id: string;
    settings: Record<string, any>;
    user_id: string;
  };
  video_url: string;
  meta_url: string;
}

export interface AssetPromptResponse {
  prompt: {
    positive: {
      content: string;
      setting: string;
      style: string;
      references: string;
    };
    negative: string;
  };
}
