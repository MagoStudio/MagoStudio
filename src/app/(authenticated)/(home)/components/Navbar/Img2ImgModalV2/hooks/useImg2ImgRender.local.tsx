import { getAssetDimensions } from "@domains/asset/utils/getAssetDimensions";
import { backendCloudApi } from "@domains/cloud/backendCloudApi";
import { Img2ImgSettingsPayload } from "@domains/cloud/mirrorImg2ImgSettings";
import { submitCloudImg2ImgRender } from "@domains/cloud/submitCloudImg2ImgRender";
import { useCloudSyncProgressToast } from "@domains/cloud/useCloudSyncProgressToast";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useIsOnboardingImageCapReached } from "@domains/onboarding/useIsOnboardingImageCapReached";
import { useBalance } from "@domains/payment/useBalance";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useBlockRenderWhileLocalSetupRuns } from "@domains/renders/useBlockRenderWhileLocalSetupRuns";
import { useHandleRenderSubmitError } from "@domains/renders/useHandleRenderSubmitError";
import { useRefreshRendersInProgress } from "@domains/renders/useRefreshRendersInProgress";
import {
  isShotCroppedSectionOfInputVideo,
  toCropWireFields,
  toCroppedOutputDimensions
} from "@domains/renders/utils/cropRect";
import { imageRenderPrecondition } from "@domains/renders/utils/localRenderPrecondition";
import { useSelectedShot } from "@domains/shot/useSelectedShot";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useInputTrack } from "@domains/track/useInputTrack";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import { getTrackAsset } from "@domains/track/utils/getTrackAsset";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { useAddImage2ImageRender } from "@hooks/renders/useAddImage2ImageRender";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { RenderMode } from "@hooks/types";
import { Img2ImgSettings } from "@models/img2img/types";
import { useShotCrop } from "@store/cropStore";
import { useQueryClient } from "@tanstack/react-query";
import { cropImageToNormalizedRect } from "@utils/image/cropImageToNormalizedRect";
import { useRef } from "react";

import { OPEN_CREDENTIALS_EVENT } from "@/platform/localDesktop";
import { LocalImageModel } from "@/platform/localImageModels";
import { resolveImageRenderProvider } from "@/platform/renderTarget";
import { queryKeys } from "@/queryKeys";

import { getAdapter } from "../adapters";
import { compositeMask } from "../DrawMask/utils/compositeMask";
import { Img2ImgType } from "../schemas";
import { hasImg2ImgInputImage } from "../utils/hasImg2ImgInputImage";

import { buildImg2ImgRenderName } from "./utils/buildImg2ImgRenderName";
import { isImg2ImgSubmissionBlockedByPaymentGates } from "./utils/isImg2ImgSubmissionBlockedByPaymentGates";
import { resolveImg2ImgFrame } from "./utils/resolveImg2ImgFrame";

export const useImg2ImgRender = (currentFrame: number) => {
  const queryClient = useQueryClient();
  const isLocalDesktop = typeof window !== "undefined" && !!window.mago;
  const selectedProjectId = useSelectedProjectId();
  const { data: selectedProject } = useProject(selectedProjectId);
  const { mutateAsync: addImage2ImageRender } = useAddImage2ImageRender();
  const { data: balanceData } = useBalance();
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const isOnboardingActive = useIsOnboardingActive();
  const onboardingCapReached = useIsOnboardingImageCapReached();
  const isOnboardingSubmittingRef = useRef(false);
  const { selectedShotId } = useSelectedShotId();
  const { data: selectedShot } = useSelectedShot();
  const { refreshRendersInProgressIfNeeded } = useRefreshRendersInProgress();
  const handleRenderSubmitError = useHandleRenderSubmitError();
  const blockRenderWhileLocalSetupRuns = useBlockRenderWhileLocalSetupRuns();
  const { inputTrackFrameSrc } = useInputTrackFrameSrc({
    frameNumber: currentFrame
  });
  const { inputTrack } = useInputTrack();
  const { crop } = useShotCrop();
  const { onProgress: onCloudSyncProgress, dismiss: dismissCloudSyncToast } =
    useCloudSyncProgressToast();

  const videoAsset = getTrackAsset(inputTrack);

  const { width: assetWidth, height: assetHeight } = getAssetDimensions(
    getTrackAssetData(inputTrack)
  );
  const width = assetWidth || 0;
  const height = assetHeight || 0;

  const userCreditsCount = balanceData?.amount || 0;

  const submitRender = async (data: Img2ImgType) => {
    if (
      blockRenderWhileLocalSetupRuns(
        imageRenderPrecondition(data.model, { isLocalApp: isLocalDesktop }) ===
          "comfy"
      )
    )
      return;
    const {
      generationCost,
      model,
      uploadedImageId,
      frameType,
      iteratedAssetId,
      iteratedSourceFrame,
      ...restData
    } = data;
    const {
      referenceImages,
      maskImages,
      maskLayerDataUrl,
      maskedFrameSrc,
      maskFrameIdx,
      ...restDataWithoutImages
    } = restData as typeof restData & {
      referenceImages: string[];
      maskImages?: string[];
      maskLayerDataUrl?: string;
      maskedFrameSrc?: string;
      maskFrameIdx?: number;
    };

    const hasDrawnMask =
      frameType === "video" && Boolean(maskLayerDataUrl && maskedFrameSrc);
    const maskBaseFrameSrc = maskedFrameSrc ?? inputTrackFrameSrc;

    const adapter = getAdapter(data);
    const actualCost = adapter.computeCost(data);
    const hasEnoughCreditsForImg2img = userCreditsCount >= actualCost;
    const renderProvider = resolveImageRenderProvider(model);
    const isMagoCloudRender = renderProvider === "mago-cloud";
    if (
      isImg2ImgSubmissionBlockedByPaymentGates({
        renderProvider,
        hasEnoughCreditsForImg2img,
        isUnlimitedModeActive,
        isOnboardingActive,
        isOnboardingImageCapReached: onboardingCapReached
      })
    ) {
      return;
    }
    if (
      !videoAsset?.id ||
      !selectedShotId ||
      !hasImg2ImgInputImage({
        frameType,
        maskLayerDataUrl,
        maskedFrameSrc,
        inputTrackFrameSrc
      })
    ) {
      return;
    }

    if (isOnboardingActive) {
      if (isOnboardingSubmittingRef.current) return;
      isOnboardingSubmittingRef.current = true;
    }

    let inputImagePayload: Pick<
      Img2ImgSettings,
      "input_image_id" | "input_image"
    >;
    let didCropInputImage = false;

    if (frameType === "video") {
      let inputImage = inputTrackFrameSrc || undefined;
      if (hasDrawnMask && maskBaseFrameSrc && maskLayerDataUrl) {
        inputImage = maskBaseFrameSrc;
        try {
          inputImage = await compositeMask(maskBaseFrameSrc, maskLayerDataUrl);
        } catch (error) {
          console.error(
            "Mask compositing failed, using plain masked frame:",
            error
          );
        }
      }
      if (inputImage && isShotCroppedSectionOfInputVideo({ crop })) {
        try {
          inputImage = await cropImageToNormalizedRect({
            imageSrc: inputImage,
            crop: crop!
          });
          didCropInputImage = true;
        } catch (error) {
          console.error("Frame crop failed, using full frame:", error);
        }
      }
      inputImagePayload = {
        input_image: inputImage
      };
    } else {
      if (iteratedAssetId) {
        inputImagePayload = {
          input_image_id: iteratedAssetId
        };
      } else if (uploadedImageId) {
        inputImagePayload = {
          input_image_id: uploadedImageId
        };
      } else {
        isOnboardingSubmittingRef.current = false;
        throw new Error(
          "Upload mode requires either an iterated or uploaded image"
        );
      }
    }

    const cropWireFields =
      frameType === "video"
        ? toCropWireFields({ crop, sourceWidth: width, sourceHeight: height })
        : {};

    const outputDimensions =
      frameType === "video"
        ? toCroppedOutputDimensions({
            crop: didCropInputImage ? crop : undefined,
            sourceWidth: width,
            sourceHeight: height
          })
        : { width, height };

    const settings: Img2ImgSettings = {
      ...restDataWithoutImages,
      render_model: model,
      reference_images: referenceImages,
      prompt: data.prompt,
      width: outputDimensions.width,
      height: outputDimensions.height,
      ...adapter.buildSettings(data),
      ...cropWireFields,
      ...inputImagePayload
    };

    try {
      const renderMode = isUnlimitedModeActive
        ? RenderMode.UNLIMITED
        : RenderMode.CREDITS;
      trackingUtils.renderActions.img2imgGenerate(actualCost, settings, model);

      const frameForRender =
        hasDrawnMask && maskFrameIdx != null ? maskFrameIdx : currentFrame;
      const frame = resolveImg2ImgFrame(
        iteratedAssetId,
        iteratedSourceFrame,
        frameForRender
      );
      const name = buildImg2ImgRenderName(selectedShot?.layers, frame);

      const payload = {
        settings,
        source_asset: videoAsset?.id,
        timeline_id: selectedShotId,
        frame,
        img_file_type: "jpg",
        renderMode,
        render_model: model,
        name
      };
      if (isLocalDesktop) {
        // A cloud image render needs neither Comfy nor a fal key.
        const precondition = imageRenderPrecondition(model, {
          isLocalApp: true
        });
        if (precondition === "comfy") {
          const comfy = await window.mago.comfy.check();
          if (!comfy.available) {
            window.dispatchEvent(
              new CustomEvent(OPEN_CREDENTIALS_EVENT, {
                detail: { reason: "comfy" }
              })
            );
            return;
          }
          const modelStatus = await window.mago.comfy.modelStatus({
            model: model as LocalImageModel,
            settings: settings as unknown as Record<string, unknown>
          });
          if (!modelStatus.ready)
            throw new Error(
              modelStatus.message ?? "The selected ComfyUI model is not ready"
            );
        }
        const projectId = String(
          selectedShot?.project_id ?? videoAsset.project_ids?.[0] ?? ""
        );
        if (!projectId) throw new Error("Local project is unavailable");

        if (isMagoCloudRender) {
          await submitCloudImg2ImgRender(backendCloudApi(), {
            payload: {
              settings: settings as unknown as Img2ImgSettingsPayload,
              frame,
              img_file_type: "jpg",
              render_mode: renderMode,
              render_model: model,
              name
            },
            local: {
              projectId,
              projectName: selectedProject?.name ?? name,
              shotId: selectedShotId,
              shotName: selectedShot?.name ?? name,
              assetId: videoAsset.id,
              assetName: videoAsset.name ?? name
            },
            onProgress: onCloudSyncProgress
          });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.queue.all }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.project.byId(projectId)
            })
          ]);
          return;
        }

        await window.mago.imageRenders.submit({
          projectId,
          shotId: selectedShotId,
          sourceAssetId: videoAsset.id,
          frame,
          name,
          model: model as LocalImageModel,
          inputImage: inputImagePayload.input_image,
          inputImageId: inputImagePayload.input_image_id,
          referenceImageIds: referenceImages,
          maskImageIds: maskImages,
          estimatedCostUsd: 0,
          settings: settings as unknown as Record<string, unknown>
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.queue.all }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.project.byId(projectId)
          })
        ]);
        return;
      }
      await addImage2ImageRender(payload);
      if (isUnlimitedModeActive) {
        await refreshRendersInProgressIfNeeded();
      }
    } catch (error) {
      console.error("Error generating image:", error);
      handleRenderSubmitError(error);
    } finally {
      isOnboardingSubmittingRef.current = false;
      dismissCloudSyncToast();
    }
  };

  return submitRender;
};
