import {
  BulkRendersRunDraftMasterSettings,
  bulkRenderingFlowAtom
} from "@store/atoms";
import { useSetAtom } from "jotai";

import { buildBulkRenderingDraftShotPromptOverrides } from "./utils/buildBulkRenderingDraftShotPromptOverrides";
import { BulkRendersRunShotPromptOverride } from "./utils/buildCreateBulkRendersRunRequest";
import { resolveBulkRenderingMasterPrompts } from "./utils/resolveBulkRenderingMasterPrompts";

export interface BulkRenderingDraftShotPromptsState {
  defaultImagePrompt: string;
  defaultVideoPrompt: string;
  getImagePrompt: (shotId: string) => string;
  getVideoPrompt: (shotId: string) => string;
  setImagePrompt: (shotId: string, value: string) => void;
  setVideoPrompt: (shotId: string, value: string) => void;
  hasAnyShotPromptOverride: boolean;
  shotPromptOverrideById: Record<string, BulkRendersRunShotPromptOverride>;
}

export const useBulkRenderingDraftShotPrompts = ({
  masterSettings,
  imagePromptByShotId,
  videoPromptByShotId
}: {
  masterSettings: BulkRendersRunDraftMasterSettings;
  imagePromptByShotId: Record<string, string>;
  videoPromptByShotId: Record<string, string>;
}): BulkRenderingDraftShotPromptsState => {
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);

  const {
    masterImagePrompt: defaultImagePrompt,
    masterVideoPrompt: defaultVideoPrompt
  } = resolveBulkRenderingMasterPrompts(masterSettings);

  const getImagePrompt = (shotId: string) =>
    imagePromptByShotId[shotId] ?? defaultImagePrompt;
  const getVideoPrompt = (shotId: string) =>
    videoPromptByShotId[shotId] ?? defaultVideoPrompt;

  const setImagePrompt = (shotId: string, value: string) =>
    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view !== "draft") return currentFlow;

      return {
        ...currentFlow,
        imagePromptByShotId: {
          ...currentFlow.imagePromptByShotId,
          [shotId]: value
        }
      };
    });
  const setVideoPrompt = (shotId: string, value: string) =>
    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view !== "draft") return currentFlow;

      return {
        ...currentFlow,
        videoPromptByShotId: {
          ...currentFlow.videoPromptByShotId,
          [shotId]: value
        }
      };
    });

  const shotPromptOverrideById = buildBulkRenderingDraftShotPromptOverrides({
    imagePromptByShotId: new Map(Object.entries(imagePromptByShotId)),
    videoPromptByShotId: new Map(Object.entries(videoPromptByShotId)),
    defaultImagePrompt,
    defaultVideoPrompt
  });

  return {
    defaultImagePrompt,
    defaultVideoPrompt,
    getImagePrompt,
    getVideoPrompt,
    setImagePrompt,
    setVideoPrompt,
    hasAnyShotPromptOverride: Object.keys(shotPromptOverrideById).length > 0,
    shotPromptOverrideById
  };
};
