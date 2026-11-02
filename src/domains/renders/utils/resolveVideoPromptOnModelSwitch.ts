import { VideoEngine } from "@models/video/types";

export interface ResolveVideoPromptOnModelSwitchInput {
  previousModel: VideoEngine;
  nextModel: VideoEngine;
  currentPrompt: string;
  nextModelDefaultPrompt: string | undefined;
  promptMemory: Record<string, string>;
}

export interface ResolveVideoPromptOnModelSwitchResult {
  shouldUpdatePrompt: boolean;
  nextPrompt: string | undefined;
  nextPromptMemory: Record<string, string>;
}

const isPromptWipeModel = (model: VideoEngine) =>
  model === VideoEngine.seedance_2 || model === VideoEngine.happy_horse_1;

export const resolveVideoPromptOnModelSwitch = ({
  previousModel,
  nextModel,
  currentPrompt,
  nextModelDefaultPrompt,
  promptMemory
}: ResolveVideoPromptOnModelSwitchInput): ResolveVideoPromptOnModelSwitchResult => {
  if (isPromptWipeModel(nextModel)) {
    return {
      shouldUpdatePrompt: true,
      nextPrompt: nextModelDefaultPrompt ?? "",
      nextPromptMemory: promptMemory
    };
  }

  let shouldUpdatePrompt = false;
  let nextPrompt: string | undefined;

  if (isPromptWipeModel(previousModel)) {
    shouldUpdatePrompt = true;
    nextPrompt = undefined;
  }

  const isKlingSwitch =
    previousModel === VideoEngine.kling_o1 ||
    nextModel === VideoEngine.kling_o1;
  if (isKlingSwitch) {
    shouldUpdatePrompt = true;
    nextPrompt = "";
  }

  let nextPromptMemory = promptMemory;

  if (
    nextModel === VideoEngine.v1_0_0_mask &&
    previousModel === VideoEngine.v1_0_0_upscaler
  ) {
    nextPromptMemory = { ...nextPromptMemory, [previousModel]: currentPrompt };
  }
  if (nextModel === VideoEngine.v1_0_0_mask) {
    return {
      shouldUpdatePrompt: true,
      nextPrompt: nextModelDefaultPrompt ?? "",
      nextPromptMemory
    };
  }

  if (previousModel === VideoEngine.v1_0_0_mask) {
    shouldUpdatePrompt = true;
    nextPrompt = "";
  }

  if (
    nextModel === VideoEngine.v1_0_0_upscaler &&
    previousModel !== VideoEngine.v1_0_0_mask
  ) {
    nextPromptMemory = { ...nextPromptMemory, other: currentPrompt };
  }
  if (nextModel === VideoEngine.v1_0_0_upscaler) {
    const restoredPrompt =
      nextPromptMemory?.[nextModel] || nextModelDefaultPrompt;
    if (restoredPrompt) {
      return {
        shouldUpdatePrompt: true,
        nextPrompt: restoredPrompt,
        nextPromptMemory
      };
    }
    return { shouldUpdatePrompt, nextPrompt, nextPromptMemory };
  }

  if (previousModel !== VideoEngine.v1_0_0_upscaler) {
    return { shouldUpdatePrompt, nextPrompt, nextPromptMemory };
  }

  nextPromptMemory = { ...nextPromptMemory, [previousModel]: currentPrompt };
  if (nextPromptMemory.other) {
    shouldUpdatePrompt = true;
    nextPrompt = nextPromptMemory.other;
  }

  return { shouldUpdatePrompt, nextPrompt, nextPromptMemory };
};
