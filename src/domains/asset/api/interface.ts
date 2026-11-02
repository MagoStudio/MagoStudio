import { AutoPromptVersionEnum } from "@hooks/types";
import { Asset } from "@schemas/asset";

interface AssetFrame {
  url: string;
  width: number;
  height: number;
}

export interface ImageAssetResponse {
  s3_url: string;
  urlToUse: string;
  frames?: AssetFrame[];
  labeled_frames?: AssetFrame[];
  asset: {
    id: string;
    name: string;
    data: {
      size?: [number, number];
      width?: number;
      height?: number;
      duration: number;
      thumbnail_filepath: string;
      auto_prompt?: AutoPromptItem[];
      prompt?: {
        positive: {
          content: string;
          setting: string;
          style: string;
          references: string;
        };
        negative: string;
      };
    };
    rate: number;
    user_id: string;
    filepath: string;
    type: string;
    created_at: string;
  };
}

interface VideoAssetIngestionError {
  error_type: string;
  error_message: string;
  status?: number;
}

interface VideoAssetIngestionPending {
  status: "pending";
}

export interface VideoAssetIngestionSuccess {
  s3_url: string;
  urlToUse: string;
  asset: Asset;
}

type VideoAssetGenericError = {
  error: string;
};

type OldApiVideoAsset = {
  video_url: string;
};

type VideoAssetNotStarted =
  | {
      status: "not_started";
    }
  | VideoAssetIngestionError;

export type VideoAssetResponse =
  | VideoAssetIngestionError
  | VideoAssetIngestionPending
  | VideoAssetIngestionSuccess
  | VideoAssetGenericError
  | VideoAssetNotStarted
  | OldApiVideoAsset;

export interface AutoPromptItem {
  video_asset_id: string;
  version:
    | AutoPromptVersionEnum.IMG2IMG_MAGO
    | AutoPromptVersionEnum.VIDEO2VIDEO_DEFAULT;
  positive_prompt: string;
}
