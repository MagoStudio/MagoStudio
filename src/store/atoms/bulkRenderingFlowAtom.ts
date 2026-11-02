import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { GptImage2Quality } from "@home/components/Navbar/Img2ImgModalV2/schemas/gptImage2.schema";
import { Nanobanana2Resolution } from "@home/components/Navbar/Img2ImgModalV2/schemas/nanobanana2.schema";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { atom } from "jotai";

export interface BulkRendersRunDraftMasterSettings {
  imageSettings: Img2ImgType;
  videoSettings: VideoSettings;
  videoModel: VideoModelDefinition;
  frameRange: [number, number];
  isFullFrameRangePresetSelected: boolean;
}

export interface BulkRenderingDraftShotImageSettingPatch {
  quality?: GptImage2Quality;
  resolution?: Nanobanana2Resolution;
}

export type BulkRenderingFirstFrameSource = "generated" | "uploaded";

export interface BulkRenderingDraftState {
  view: "draft";
  selectedShotIds: Set<string>;
  firstFrameSource: BulkRenderingFirstFrameSource | undefined;
  uploadedFirstFrameAssetIdByShotId: Record<string, string>;
  imagePromptByShotId: Record<string, string>;
  videoPromptByShotId: Record<string, string>;
  imageReferenceAssetIdsByShotId: Record<string, string[]>;
  imageModelByShotId: Record<string, Img2ImgType["model"]>;
  imageSourceFrameByShotId: Record<string, number>;
  videoSettingsByShotId: Record<string, Partial<VideoSettings>>;
  imageSettingByShotId: Record<string, BulkRenderingDraftShotImageSettingPatch>;
  masterSettings: BulkRendersRunDraftMasterSettings;
}

export type BulkRenderingFlowState =
  | { view: "shotSelection"; selectedShotIds: Set<string> }
  | BulkRenderingDraftState
  | { view: "run"; bulkRunId: string }
  | { view: "panel"; expandedHistoryRunId: string | undefined }
  | null;

export const bulkRenderingFlowAtom = atom<BulkRenderingFlowState>(null);
