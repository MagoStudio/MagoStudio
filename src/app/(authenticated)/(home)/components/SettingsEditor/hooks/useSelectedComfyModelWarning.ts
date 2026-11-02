import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";

import { isComfyLocalVideoModel } from "@/platform/localVideoModels";

import { buildComfyModelStatusSettings } from "../utils/buildComfyModelStatusSettings";

const MODEL_STATUS_REFRESH_INTERVAL_MS = 5000;

export const useSelectedComfyModelWarning = (): string | null => {
  const { renderSettingsValuesAtom, selectedModelAtom, sourcesAtom } =
    useRenderSettingsAtoms();
  const values = useAtomValue(renderSettingsValuesAtom);
  const sources = useAtomValue(sourcesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const selectedModelName = selectedModel.name;

  const dependencySettings = buildComfyModelStatusSettings({
    modelName: selectedModelName,
    renderSettingsValues: values,
    sources
  });

  const isModelStatusCheckable =
    isComfyLocalVideoModel(selectedModelName) && !!window.mago?.comfy;
  const modelStatus = useQuery({
    queryKey: [
      "selected-comfy-model-status",
      selectedModelName,
      dependencySettings
    ],
    queryFn: () =>
      window.mago.comfy.modelStatus({
        model: selectedModelName as Parameters<
          typeof window.mago.comfy.modelStatus
        >[0]["model"],
        settings: dependencySettings
      }),
    enabled: isModelStatusCheckable,
    retry: false,
    refetchInterval: MODEL_STATUS_REFRESH_INTERVAL_MS
  });

  if (!isModelStatusCheckable) return null;
  if (modelStatus.error) {
    return modelStatus.error instanceof Error
      ? modelStatus.error.message
      : `Unable to validate ${selectedModel.displayName}`;
  }
  if (modelStatus.data && !modelStatus.data.ready) {
    return (
      modelStatus.data.message ?? `${selectedModel.displayName} is not ready`
    );
  }
  return null;
};
