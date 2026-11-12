import { comfySettings, magoState, version, vlmStatus } from "./app";
import {
  assetLibraryItems,
  assetPrompt,
  assetPromptGeneratedInCloud,
  imageAsset,
  imageAssetBatch,
  videoAsset,
  videoDurationSeconds,
  videoHasAudioTrack
} from "./asset";
import {
  bulkRendersRunDetail,
  bulkRendersRunProgress,
  bulkRendersRuns,
  bulkRendersRunSteps
} from "./bulkRendersRun";
import { balance, prices } from "./payment";
import { planDetail, planProgress, planSteps, plans } from "./plan";
import {
  homepage,
  project,
  projectList,
  projectStats,
  projects,
  timelineList
} from "./project";
import { queue } from "./queue";
import { autoPrompt, img2imgStatus } from "./render";
import {
  projectCut,
  projectScriptVersions,
  projectState,
  scriptChatMessages,
  sheetImageInputs
} from "./scriptProject";
import { voiceLibrary, voicePreviewUrl } from "./voiceLibrary";

export const queryKeys = {
  project,
  projects,
  projectList,
  homepage,
  projectStats,
  timelineList,
  projectState,
  projectScriptVersions,
  scriptChatMessages,
  projectCut,
  sheetImageInputs,
  queue,
  balance,
  prices,
  plans,
  bulkRendersRuns,
  bulkRendersRunProgress,
  bulkRendersRunSteps,
  bulkRendersRunDetail,
  planProgress,
  planSteps,
  planDetail,
  videoAsset,
  videoDurationSeconds,
  videoHasAudioTrack,
  imageAsset,
  assetPrompt,
  assetPromptGeneratedInCloud,
  imageAssetBatch,
  assetLibraryItems,
  img2imgStatus,
  autoPrompt,
  magoState,
  version,
  voiceLibrary,
  voicePreviewUrl,
  vlmStatus,
  comfySettings
} as const;
