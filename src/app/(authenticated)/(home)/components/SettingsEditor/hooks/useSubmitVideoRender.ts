import { SourceImage } from "@domains/renders/types";
import { useAddRender } from "@domains/renders/useAddRender";
import { useHandleRenderSubmitError } from "@domains/renders/useHandleRenderSubmitError";
import { useRenderDurationLimits } from "@domains/renders/useRenderDurationLimits";
import { useRenderImageDimensions } from "@domains/renders/useRenderImageDimensions";
import { NormalizedCropRect } from "@domains/renders/utils/cropRect";
import { extractRenderErrorMessage } from "@domains/renders/utils/extractRenderErrorMessage";
import { getMaskTrack } from "@domains/renders/utils/getMaskTrack";
import {
  RenderTarget,
  validateRenderPayload
} from "@domains/renders/utils/validateRenderPayload";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { getTimelineOffset } from "@domains/track/utils/frameCoordinates";
import { useQueue } from "@hooks/queue/useQueue";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { RenderMode } from "@hooks/types";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { useToast } from "@store/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { queryKeys } from "@/queryKeys";

interface SubmitVideoRenderParams {
  layerId: string;
  renderSettings: VideoSettings;
  range: number[];
  sources: SourceImage[];
  model: VideoModelDefinition;
  inputTrackId: string;
  inputVideoWidth: number | undefined;
  inputVideoHeight: number | undefined;
  fps: number;
  isUnlimitedModeActive: boolean;
  selectedProjectId: string | undefined;
  target?: RenderTarget;
  crop?: NormalizedCropRect;
}

export const useSubmitVideoRender = () => {
  const { t } = useTranslation();
  const { mutateAsync: addRenderMutation } = useAddRender();
  const { triggerRefetch } = useQueue();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const handleRenderSubmitError = useHandleRenderSubmitError();
  const durationLimits = useRenderDurationLimits();
  const imageDimensions = useRenderImageDimensions();
  const {
    data: { videoTrack, tracks }
  } = useFilteredAndSortedTracks();

  const submitVideoRender = async ({
    layerId,
    renderSettings,
    range,
    sources,
    model,
    inputTrackId,
    inputVideoWidth,
    inputVideoHeight,
    fps,
    isUnlimitedModeActive,
    selectedProjectId,
    target = "range",
    crop
  }: SubmitVideoRenderParams): Promise<boolean> => {
    if (!layerId) {
      console.error("Layer ID is missing");
      return false;
    }

    const sourceTrack = [videoTrack, ...tracks].find(
      (track) => track?.id === inputTrackId
    );
    const payloadValidation = validateRenderPayload({
      model,
      renderSettingsValues: renderSettings,
      sources,
      fps,
      isUnlimitedModeActive,
      inputVideoWidth,
      inputVideoHeight,
      imageDimensions,
      rangeFrames: [range[0], range[1]],
      durationLimits,
      maskTrack: getMaskTrack(renderSettings, tracks),
      sourceTrackTimelineOffset: getTimelineOffset(sourceTrack),
      crop,
      tracks,
      target
    });
    if (!payloadValidation.isRenderPayloadValid) {
      console.error(
        "Render payload failed validation:",
        payloadValidation.errorKeys
      );
      showToast({
        message: t("notifications.render_generation_failed.description")
      });
      return false;
    }

    try {
      const renderMode = isUnlimitedModeActive
        ? RenderMode.UNLIMITED
        : RenderMode.CREDITS;

      await addRenderMutation({
        parentLayerId: layerId,
        frameRange: range,
        renderSettings,
        sources,
        inputTrackId,
        renderEngine: "magov2",
        renderMode,
        model,
        inputVideoWidth,
        inputVideoHeight,
        fps,
        crop
      });

      void queryClient.refetchQueries({ queryKey: queryKeys.queue.all });

      try {
        const hasStyleReference = sources.some(
          (entry) => entry.type === "reference_frame"
        );
        trackingUtils.renderActions.startGeneration({
          trackId: layerId,
          frameRange: range,
          renderSettings,
          styleReference: hasStyleReference,
          magoEngine: model.name,
          videoGenerationMode: "generate",
          modelDisplayName: model.displayName
        });
      } catch (error) {
        console.error("Error in tracking:", error);
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project.byId(selectedProjectId)
      });
      triggerRefetch();
      return true;
    } catch (error) {
      console.error("Render generation failed:", error);
      if (handleRenderSubmitError(error)) return false;
      const beDetail = extractRenderErrorMessage(error);
      showToast({
        message:
          beDetail ?? t("notifications.render_generation_failed.description")
      });
      return false;
    }
  };

  return { submitVideoRender };
};
