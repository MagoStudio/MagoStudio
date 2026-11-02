import { getOnboardingRenderRange } from "@domains/onboarding/utils/getOnboardingRenderRange";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { getInputVideoDimensions } from "@domains/renders/utils/getInputVideoDimensions";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { useAddTrack } from "@domains/track/useAddTrack";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useGetTrackById } from "@domains/track/useGetTrackById";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { useInputTrackIdAtom } from "@store/atoms";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useToast } from "@store/useToast";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { useSubmitVideoRender } from "../SettingsEditor/hooks/useSubmitVideoRender";

export const useGenerateOnboardingVideoRender = () => {
  const { submitVideoRender } = useSubmitVideoRender();
  const { addTrack } = useAddTrack();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const shotMaxFrames = useShotMaxFrames();
  const { fps } = useFpsForShot();

  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();
  const inputTrackIdAtom = useInputTrackIdAtom();
  const inputTrackId = useAtomValue(inputTrackIdAtom);

  const { renderSettingsValuesAtom, selectedModelAtom, sourcesAtom } =
    useRenderSettingsAtoms();
  const renderSettingsValues = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const sources = useAtomValue(sourcesAtom);

  const { data: sourceTrack } = useGetTrackById({
    trackId: inputTrackId || videoTrack?.id,
    selectedProjectId,
    selectedShotId
  });

  const renderRange = getOnboardingRenderRange(shotMaxFrames, fps);
  const { inputVideoWidth, inputVideoHeight } =
    getInputVideoDimensions(sourceTrack);

  const generate = async (promptOverride?: string): Promise<boolean> => {
    if (!selectedProjectId || !videoTrack) return false;
    let track: Awaited<ReturnType<typeof addTrack>>;
    try {
      track = await addTrack({
        parentTrackOrder: sourceTrack?.layer_order
      });
    } catch (error) {
      console.error("Failed to create track:", error);
      showToast({
        message: t("notifications.failed_to_create_track.description")
      });
      return false;
    }
    if (!track) {
      showToast({
        message: t("notifications.failed_to_create_track.description")
      });
      return false;
    }
    const renderSettings =
      promptOverride === undefined
        ? renderSettingsValues
        : { ...renderSettingsValues, prompt: promptOverride };
    return submitVideoRender({
      layerId: track.id,
      renderSettings,
      range: renderRange,
      sources,
      model: selectedModel,
      inputTrackId: inputTrackId || videoTrack.id,
      inputVideoWidth,
      inputVideoHeight,
      fps,
      isUnlimitedModeActive: false,
      selectedProjectId
    });
  };

  return { generate };
};
