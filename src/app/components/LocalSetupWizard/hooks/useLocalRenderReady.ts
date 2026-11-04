import { VideoEngine } from "@models/video/types";
import { useQuery } from "@tanstack/react-query";

import { isComfyLocalVideoModel } from "@/platform/localVideoModels";

import {
  MINIMAX_H3_STEP_LORAS,
  type MiniMaxH3StepLoraSteps
} from "../../../../../desktop/shared/minimaxH3StepLoras";

export const useLocalVideoReady = (
  model: VideoEngine,
  settings: Record<string, unknown>
) => {
  const enabled = isComfyLocalVideoModel(model);
  const result = useQuery({
    queryKey: ["local-video-setup", model, settings],
    queryFn: () =>
      window.mago.comfy.modelStatus({
        model: model as Parameters<
          typeof window.mago.comfy.modelStatus
        >[0]["model"],
        settings
      }),
    enabled,
    retry: false,
    refetchInterval: 5000
  });
  return !enabled || (!result.isError && result.data?.ready === true);
};

export const useLocalShotsReady = (
  enabled: boolean,
  steps: MiniMaxH3StepLoraSteps
) => {
  const result = useQuery({
    queryKey: ["local-script-setup"],
    queryFn: () => window.mago.comfy.scriptSetupStatus(),
    enabled,
    retry: false,
    refetchInterval: 5000
  });
  const selectedStepLoraRequirement = [
    ...(result.data?.models ?? []),
    ...(result.data?.optionalStepLoras ?? [])
  ].find((item) => item.name === MINIMAX_H3_STEP_LORAS[steps].loraFile);
  return (
    !enabled ||
    (!result.isError &&
      result.data?.ready === true &&
      selectedStepLoraRequirement?.status === "installed")
  );
};
