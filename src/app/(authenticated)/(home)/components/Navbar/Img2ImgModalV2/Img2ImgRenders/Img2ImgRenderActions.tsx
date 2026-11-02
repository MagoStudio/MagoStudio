import { GhostButton } from "@components/GhostButton";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { SourceImageCrop } from "@domains/renders/utils/getImg2ImgClipCrop";
import { OnboardingUseThisHint } from "@home/components/onboarding/OnboardingUseThisHint";
import { useSelectOnboardingImage } from "@home/components/onboarding/useSelectOnboardingImage";
import { downloadFile } from "@hooks/files/utils";
import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import { Img2ImgRenderStatus } from "@models/img2img/types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { useImg2ImgUseImage } from "../hooks/useImg2ImgUseImage";
import { IterateButton } from "../Img2imgModalHistory/IterateButton";
import { TweakButton } from "../Img2imgModalHistory/TweakButton";

import { ShotCropOverwriteWarningModal } from "./ShotCropOverwriteWarningModal";

type Props = {
  index: number;
  disableIterate: boolean;
  assetId: string | undefined;
  clipId: string | undefined;
  clipStatus: string | undefined;
  sourceFrame: number | undefined;
  filename: string;
  isFirstSuccessfulRender?: boolean;
  imageCrop?: SourceImageCrop;
};

export const Img2ImgRenderActions: React.FC<Props> = ({
  index,
  disableIterate,
  assetId,
  clipId,
  clipStatus,
  sourceFrame,
  filename,
  isFirstSuccessfulRender = false,
  imageCrop
}) => {
  const { t } = useTranslation();
  const selectedProjectId = useSelectedProjectId();
  const { data: project } = useProject(selectedProjectId);

  const { data: assetImageResponse } = useImageAsset({
    assetId,
    enabled: clipStatus === Img2ImgRenderStatus.SUCCESS
  });

  const outputUrl =
    (typeof window !== "undefined" && window.mago
      ? assetImageResponse?.s3_url
      : assetImageResponse?.urlToUse) || "";

  const { handleUseImage, shotCropOverwriteWarning } = useImg2ImgUseImage({
    assetId,
    sourceFrame,
    assetImageResponse,
    imageCrop
  });

  const isOnboardingActive = useIsOnboardingActive();
  const { selectImage } = useSelectOnboardingImage();
  const [isShotCropOverwriteWarningOpen, setIsShotCropOverwriteWarningOpen] =
    useState(false);

  const handleUseThis = () => {
    if (isOnboardingActive && assetId) {
      selectImage(assetId);
      return;
    }
    if (shotCropOverwriteWarning) {
      setIsShotCropOverwriteWarningOpen(true);
      return;
    }
    void handleUseImage();
  };

  const handleShotCropOverwriteConfirm = () => {
    setIsShotCropOverwriteWarningOpen(false);
    void handleUseImage();
  };

  const handleImageDownload = async () => {
    if (!outputUrl) return;
    await downloadFile(outputUrl, filename);
    trackingWithProjectId.renderActions.img2imgDownloadImage(
      assetId ?? "",
      project?.id
    );
  };

  const useThisTooltipText = disableIterate
    ? t("buttonTooltips.use_this_button.disabledTooltip")
    : t("buttonTooltips.use_this_button.label");

  const showOnboardingUseThisHint =
    isOnboardingActive &&
    isFirstSuccessfulRender &&
    clipStatus === Img2ImgRenderStatus.SUCCESS;

  return (
    <div className="flex items-center gap-1">
      <div className="relative flex flex-1">
        <GhostButton
          aria-label={useThisTooltipText}
          onPress={handleUseThis}
          data-onboarding-id={`pf-use-img2img-generated-${index}`}
          isDisabled={disableIterate}
          colorScheme="white"
          className="w-full"
        >
          {t("actions.use_this.label")}
        </GhostButton>
        {showOnboardingUseThisHint && <OnboardingUseThisHint />}
      </div>
      {!isOnboardingActive && (
        <>
          <IterateButton assetId={assetId ?? ""} sourceFrame={sourceFrame} />
          <TweakButton clipId={clipId ?? ""} />
          <GhostButton
            aria-label={t("actions.download.label")}
            onPress={handleImageDownload}
          >
            {t("actions.download.label")}
          </GhostButton>
        </>
      )}
      <ShotCropOverwriteWarningModal
        warning={
          isShotCropOverwriteWarningOpen ? shotCropOverwriteWarning : undefined
        }
        onCancel={() => setIsShotCropOverwriteWarningOpen(false)}
        onConfirm={handleShotCropOverwriteConfirm}
      />
    </div>
  );
};
