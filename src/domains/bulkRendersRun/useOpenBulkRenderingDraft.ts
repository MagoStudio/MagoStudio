import { useAdjustedFrameRange } from "@domains/renders/useAdjustedFrameRange";
import { useRenderDurationLimits } from "@domains/renders/useRenderDurationLimits";
import { getActiveFrameRangePreset } from "@domains/renders/utils/getActiveFrameRangePreset";
import { getOneSecondRange } from "@domains/renders/utils/getOneSecondRange";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { bulkRenderingFlowAtom } from "@store/atoms";
import { useImg2ImgSettingsAtom } from "@store/img2imgSettingsStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";

export const useOpenBulkRenderingDraft = () => {
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);

  const { atom: img2ImgSettingsAtom } = useImg2ImgSettingsAtom();
  const imageSettings = useAtomValue(img2ImgSettingsAtom);
  const { renderSettingsValuesAtom, selectedModelAtom } =
    useRenderSettingsAtoms();
  const videoSettings = useAtomValue(renderSettingsValuesAtom);
  const videoModel = useAtomValue(selectedModelAtom);
  const frameRange = useAdjustedFrameRange();
  const shotMaxFrames = useShotMaxFrames();
  const { fps } = useFpsForShot();
  const { modelHasTimeBasedDurationLimits } = useRenderDurationLimits();

  const fullClipRange: [number, number] = [0, shotMaxFrames];
  const oneSecondRange = getOneSecondRange({
    start: frameRange[0],
    fps,
    shotMaxFrames
  });
  const activeFrameRangePreset = modelHasTimeBasedDurationLimits
    ? null
    : getActiveFrameRangePreset({
        range: frameRange,
        fullClipRange,
        oneSecondRange
      });
  const isFullFrameRangePresetSelected = activeFrameRangePreset === "full";

  return () => {
    setBulkRenderingFlow((currentFlow) => {
      if (currentFlow?.view !== "shotSelection") return currentFlow;

      return {
        view: "draft",
        selectedShotIds: currentFlow.selectedShotIds,
        firstFrameSource: undefined,
        uploadedFirstFrameAssetIdByShotId: {},
        imagePromptByShotId: {},
        videoPromptByShotId: {},
        imageReferenceAssetIdsByShotId: {},
        imageModelByShotId: {},
        imageSourceFrameByShotId: {},
        videoSettingsByShotId: {},
        imageSettingByShotId: {},
        masterSettings: {
          imageSettings,
          videoSettings,
          videoModel,
          frameRange,
          isFullFrameRangePresetSelected
        }
      };
    });
  };
};
