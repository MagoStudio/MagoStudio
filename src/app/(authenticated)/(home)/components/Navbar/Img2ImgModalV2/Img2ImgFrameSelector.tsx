import { FrameControls, FrameScrubber } from "@components/FrameScrubber";
import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { ImagePreview } from "@components/ImageThumbnail/ImagePreview";
import { InfoBlock } from "@components/InfoBlock";
import { isShotCroppedSectionOfInputVideo } from "@domains/renders/utils/cropRect";
import { useInputTrack } from "@domains/track/useInputTrack";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import { frameRangeOf } from "@domains/track/utils/frameCoordinates";
import { downloadFile } from "@hooks/files/utils";
import { useShotCrop } from "@store/cropStore";
import { useSetAtom } from "jotai";
import React, { useState } from "react";
import { Dialog } from "react-aria-components/Dialog";
import { Modal, ModalOverlay } from "react-aria-components/Modal";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { drawMaskActiveAtom } from "./DrawMask/drawMaskAtom";
import { useDrawnMaskPreview } from "./DrawMask/hooks/useDrawnMaskPreview";
import { clearDrawnMask } from "./DrawMask/utils/clearDrawnMask";
import { Img2ImgCropOverlay } from "./Img2ImgCropOverlay";
import { Img2ImgType } from "./schemas";
import { Seedream5ProType } from "./schemas/seedream5Pro.schema";

type Props = {
  currentFrame: number;
  setCurrentFrame: (frame: number) => void;
};

export const Img2ImgFrameSelector: React.FC<Props> = ({
  currentFrame,
  setCurrentFrame
}) => {
  const { t } = useTranslation();
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const model = useWatch<Img2ImgType, "model">({ name: "model" });
  const { setValue } = useFormContext<Seedream5ProType>();
  const maskLayerDataUrl = useWatch<Seedream5ProType, "maskLayerDataUrl">({
    name: "maskLayerDataUrl"
  });
  const maskFrameIdx = useWatch<Seedream5ProType, "maskFrameIdx">({
    name: "maskFrameIdx"
  });
  const setDrawMaskActive = useSetAtom(drawMaskActiveAtom);
  const maskPreviewSrc = useDrawnMaskPreview(currentFrame);
  const { inputTrack } = useInputTrack();
  const [minFrame, maxFrame] = inputTrack ? frameRangeOf(inputTrack) : [0, 0];
  const { inputTrackFrameSrc, isLoading: isFrameLoading } =
    useInputTrackFrameSrc({ frameNumber: currentFrame });
  const { crop } = useShotCrop();
  const showCropOverlay =
    !maskPreviewSrc && isShotCroppedSectionOfInputVideo({ crop });
  const cropOverlay =
    showCropOverlay && crop ? <Img2ImgCropOverlay crop={crop} /> : undefined;

  const handleDownload = async () => {
    if (inputTrackFrameSrc) {
      await downloadFile(inputTrackFrameSrc, `frame-${currentFrame}.jpg`);
    }
  };

  const handlePrevFrame = () => {
    if (currentFrame > minFrame) {
      setCurrentFrame(currentFrame - 1);
    }
  };

  const handleNextFrame = () => {
    if (currentFrame < maxFrame) {
      setCurrentFrame(currentFrame + 1);
    }
  };

  const isSeedream5Pro = model === "seedream_5_pro";
  const hasMask = Boolean(maskLayerDataUrl);
  const isOnMaskedFrame = hasMask && maskFrameIdx === currentFrame;
  const isMaskOnOtherFrame = hasMask && !isOnMaskedFrame;
  const maskButtonLabel = !hasMask
    ? t("img2imgForms.draw_mask.create")
    : isOnMaskedFrame
      ? t("img2imgForms.draw_mask.edit")
      : t("img2imgForms.draw_mask.add");

  const handleDeleteMask = () => {
    clearDrawnMask(setValue);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <FrameScrubber
          currentFrame={currentFrame}
          setCurrentFrame={setCurrentFrame}
          minFrame={minFrame}
          maxFrame={maxFrame}
          enableGlobalArrowHotkeys={isZoomedIn}
          imageSrc={maskPreviewSrc ?? inputTrackFrameSrc ?? undefined}
          overlay={cropOverlay}
          bottomActions={
            <div className="flex items-center gap-1">
              {isSeedream5Pro && (
                <GhostButton
                  colorScheme="default"
                  size="md"
                  startIcon={
                    <Icon iconSet="24" iconName="mask" className="!size-4" />
                  }
                  onPress={() => setDrawMaskActive(true)}
                >
                  {maskButtonLabel}
                </GhostButton>
              )}
              <IconActionButton
                aria-label="download"
                icon={<Icon iconSet="16" iconName="download" />}
                variant="dark"
                size="sm"
                onPress={handleDownload}
              />
              <IconActionButton
                aria-label="zoom in"
                icon={<Icon iconSet="16" iconName="zoom-in" />}
                variant="dark"
                size="sm"
                onPress={() => setIsZoomedIn(true)}
              />
            </div>
          }
        />

        {isSeedream5Pro && isMaskOnOtherFrame && (
          <div className="flex flex-col gap-2">
            <InfoBlock variant="info">
              {t("img2imgForms.draw_mask.frame_mismatch_warning")}
            </InfoBlock>
            <div className="flex gap-2">
              <GhostButton
                size="md"
                className="flex-1"
                onPress={() => {
                  if (maskFrameIdx != null) {
                    setCurrentFrame(maskFrameIdx);
                  }
                }}
              >
                {t("img2imgForms.draw_mask.back_to_masked_frame")}
              </GhostButton>
              <GhostButton
                size="md"
                className="flex-1"
                onPress={handleDeleteMask}
              >
                {t("img2imgForms.draw_mask.delete")}
              </GhostButton>
            </div>
          </div>
        )}
      </div>

      <ModalOverlay
        isOpen={isZoomedIn}
        onOpenChange={(open) => {
          if (!open) {
            setIsZoomedIn(false);
          }
        }}
        className="fixed z-modal top-navbar-height w-full h-full-minus-navbar bg-black/90"
      >
        <Modal className="h-full flex items-center justify-center">
          <Dialog className="outline-hidden">
            <ImagePreview
              imgSrc={maskPreviewSrc ?? inputTrackFrameSrc}
              overlay={cropOverlay}
              name={`frame-${currentFrame}.jpg`}
              onClose={() => setIsZoomedIn(false)}
              isLoading={isFrameLoading && !inputTrackFrameSrc}
              footer={
                <FrameControls
                  className="rounded bg-element-primary/90 px-2 py-1"
                  currentFrame={currentFrame}
                  setCurrentFrame={setCurrentFrame}
                  onPrev={handlePrevFrame}
                  onNext={handleNextFrame}
                />
              }
            />
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
};
