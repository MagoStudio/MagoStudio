import { happyHorse1Model } from "@app/models/video/happyHorse1Model";
import { useOnboardingProgress } from "@domains/onboarding/useOnboardingProgress";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useSetAtom } from "jotai";

export const useSelectOnboardingImage = () => {
  const [, setOnboardingProgress] = useOnboardingProgress();
  const { selectedModelAtom, updateValueAtom, sourcesAtom } =
    useRenderSettingsAtoms();
  const setSelectedModel = useSetAtom(selectedModelAtom);
  const updateValue = useSetAtom(updateValueAtom);
  const setSources = useSetAtom(sourcesAtom);

  const selectImage = (assetId: string) => {
    setSelectedModel(happyHorse1Model);
    updateValue({
      key: "resolution",
      value: "1080p",
      preservePreset: true
    });
    setSources([{ asset_id: assetId, type: "reference_frame" }]);
    setOnboardingProgress((prev) => ({
      ...prev,
      step: "render",
      selectedImageAssetId: assetId
    }));
  };

  return { selectImage };
};
