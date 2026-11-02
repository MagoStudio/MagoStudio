import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { useAddRender } from "@domains/renders/useAddRender";
import { useBlockRenderWhileLocalSetupRuns } from "@domains/renders/useBlockRenderWhileLocalSetupRuns";
import { useHandleRenderSubmitError } from "@domains/renders/useHandleRenderSubmitError";
import { extractRenderErrorMessage } from "@domains/renders/utils/extractRenderErrorMessage";
import { useQueue } from "@hooks/queue/useQueue";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { RenderMode } from "@hooks/types";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { useToast } from "@store/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { isComfyLocalVideoModel } from "@/platform/localVideoModels";
import { queryKeys } from "@/queryKeys";

import { deriveImageToVideoFrameRange } from "../utils/deriveImageToVideoFrameRange";
import { getImageToVideoValidationErrorMessage } from "../utils/getImageToVideoValidationErrorMessage";

interface SubmitImageToVideoRenderParams {
  layerId: string;
  renderSettings: VideoSettings;
  durationInSeconds: number;
  fps: number;
  model: VideoModelDefinition;
  selectedProjectId: string | undefined;
}

export const useSubmitImageToVideoRender = () => {
  const { t } = useTranslation();
  const { mutateAsync: addRenderMutation } = useAddRender();
  const { triggerRefetch } = useQueue();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const handleRenderSubmitError = useHandleRenderSubmitError();
  const blockRenderWhileLocalSetupRuns = useBlockRenderWhileLocalSetupRuns();
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();

  const submitImageToVideoRender = async ({
    layerId,
    renderSettings,
    durationInSeconds,
    fps,
    model,
    selectedProjectId
  }: SubmitImageToVideoRenderParams): Promise<boolean> => {
    if (blockRenderWhileLocalSetupRuns(isComfyLocalVideoModel(model.name)))
      return false;

    const validationErrorMessage = getImageToVideoValidationErrorMessage(
      model,
      renderSettings
    );
    if (validationErrorMessage) {
      showToast({ message: validationErrorMessage });
      return false;
    }

    const frameRange = deriveImageToVideoFrameRange(durationInSeconds, fps);

    try {
      const renderMode = isUnlimitedModeActive
        ? RenderMode.UNLIMITED
        : RenderMode.CREDITS;

      await addRenderMutation({
        parentLayerId: layerId,
        frameRange,
        renderSettings,
        sources: [],
        inputTrackId: "",
        renderEngine: "magov2",
        renderMode,
        model,
        fps
      });

      void queryClient.refetchQueries({ queryKey: queryKeys.queue.all });

      try {
        trackingUtils.renderActions.startGeneration({
          trackId: layerId,
          frameRange,
          renderSettings,
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
      const beDetail = extractRenderErrorMessage(error);
      console.error(
        "Image-to-video render generation failed:",
        beDetail ?? (error instanceof Error ? error.message : "unknown error")
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project.byId(selectedProjectId)
      });
      if (handleRenderSubmitError(error)) return false;
      showToast({
        message:
          beDetail ?? t("notifications.render_generation_failed.description")
      });
      return false;
    }
  };

  return { submitImageToVideoRender };
};
