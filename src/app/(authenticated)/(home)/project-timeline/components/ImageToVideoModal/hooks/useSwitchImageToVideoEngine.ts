import { seedance2I2vFastModel } from "@models/video/seedance2I2vFastModel";
import { seedance2I2vModel } from "@models/video/seedance2I2vModel";
import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";

import { resolveResolutionForEngine } from "../utils/resolveResolutionForEngine";

export type ImageToVideoEngineTier = "standard" | "fast";

const MODEL_BY_ENGINE_TIER: Record<
  ImageToVideoEngineTier,
  VideoModelDefinition
> = {
  standard: seedance2I2vModel,
  fast: seedance2I2vFastModel
};

export const useSwitchImageToVideoEngine = () => {
  const { storageAtom, selectedModelAtom } = useRenderSettingsAtoms();
  const selectedModel = useAtomValue(selectedModelAtom);
  const setStorage = useSetAtom(storageAtom);

  const engineTier: ImageToVideoEngineTier =
    selectedModel.name === VideoEngine.seedance_2_i2v_fast
      ? "fast"
      : "standard";

  const switchEngineTier = (targetTier: ImageToVideoEngineTier) => {
    const targetModel = MODEL_BY_ENGINE_TIER[targetTier];
    if (targetModel.name === selectedModel.name) return;

    setStorage((storage) => ({
      ...storage,
      selectedModelName: targetModel.name,
      values: {
        ...storage.values,
        mago_engine: targetModel.name,
        resolution: resolveResolutionForEngine(
          typeof storage.values.resolution === "string"
            ? storage.values.resolution
            : undefined,
          targetModel
        )
      }
    }));
  };

  return { engineTier, switchEngineTier };
};
