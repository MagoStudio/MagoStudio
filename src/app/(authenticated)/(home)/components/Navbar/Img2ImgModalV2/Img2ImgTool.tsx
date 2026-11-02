import { Divider } from "@components/Divider";
import { FieldSwitcher } from "@components/Form/Fields/FieldSwitcher";
import { Form } from "@components/Form/Form";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Text } from "@components/Text";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useInputTrack } from "@domains/track/useInputTrack";
import { frameRangeOf } from "@domains/track/utils/frameCoordinates";
import { clampFrameToRange } from "@domains/videoPlayer/utils/validateFrameInRange";
import { useMountEffect } from "@hooks/useMountEffect";
import { activeHotkeyAtom, currentVideoFrameAtom } from "@store/atoms";
import { useImg2ImgSettingsAtom } from "@store/img2imgSettingsStore";
import { cn } from "@utils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import React, { useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";

import { CopyPasteReset } from "./CopyPasteReset";
import { drawMaskActiveAtom } from "./DrawMask/drawMaskAtom";
import { DrawMaskOverlay } from "./DrawMask/DrawMaskOverlay";
import { GenerateButton } from "./GenerateButton";
import { useImg2ImgRender } from "./hooks/useImg2ImgRender";
import { Img2ImgFormPersistence } from "./Img2ImgFormPersistence";
import { Img2ImgFrameSelector } from "./Img2ImgFrameSelector";
import { Img2ImgFrameUploader } from "./Img2ImgFrameUploader";
import { Img2ImgListing } from "./Img2ImgListing";
import { Img2ImgRenders } from "./Img2ImgRenders";
import { ModelSelector } from "./ModelSelector";
import { Img2ImgSchema, Img2ImgType } from "./schemas";
import { SwitchModelForms } from "./SwitchModelForms";

type Img2ImgFrameTypeContentProps = {
  currentFrame: number;
  setCurrentFrame: (frame: number) => void;
};

const Img2ImgFrameTypeContent: React.FC<Img2ImgFrameTypeContentProps> = ({
  currentFrame,
  setCurrentFrame
}) => {
  const frameType = useWatch<Img2ImgType, "frameType">({ name: "frameType" });

  if (frameType === "video") {
    return (
      <Img2ImgFrameSelector
        currentFrame={currentFrame}
        setCurrentFrame={setCurrentFrame}
      />
    );
  }

  return <Img2ImgFrameUploader />;
};

export const Img2ImgTool: React.FC = () => {
  const { t } = useTranslation();
  const [activeScope, setActiveScope] = useAtom(activeHotkeyAtom);
  const setDrawMaskActive = useSetAtom(drawMaskActiveAtom);
  const isDrawMaskActive = useAtomValue(drawMaskActiveAtom);
  const formRef = useRef<HTMLFormElement>(null);

  useMountEffect(() => {
    setActiveScope("Img2ImgView");
    return () => {
      setActiveScope("projectView");
      setDrawMaskActive(false);
    };
  });

  const isImg2ImgScopeActive = activeScope === "Img2ImgView";

  useHotkeys(
    "mod+enter",
    () => formRef.current?.requestSubmit(),
    {
      preventDefault: true,
      enabled: isImg2ImgScopeActive && !isDrawMaskActive
    },
    [isImg2ImgScopeActive, isDrawMaskActive]
  );
  const currentVideoFrame = useAtomValue(currentVideoFrameAtom);
  const setCurrentVideoFrame = useSetAtom(currentVideoFrameAtom);
  const { inputTrack } = useInputTrack();
  const isOnboardingActive = useIsOnboardingActive();
  const [minFrame, maxFrame] = inputTrack ? frameRangeOf(inputTrack) : [0, 0];
  const clampedFrame = isOnboardingActive
    ? minFrame
    : clampFrameToRange(currentVideoFrame, minFrame, maxFrame);
  const handleSetFrame = (frame: number) => {
    if (isOnboardingActive) return;
    setCurrentVideoFrame(clampFrameToRange(frame, minFrame, maxFrame));
  };
  const [isListingOpen, setIsListingOpen] = useState(false);
  const submitRender = useImg2ImgRender(clampedFrame);

  const { atom: settingsAtom, storageKey } = useImg2ImgSettingsAtom();
  const defaultValues = useAtomValue(settingsAtom);

  const handleClipClick = (clipId: string) => {
    const element = document.getElementById(`clip-${clipId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    } else {
      console.warn(`Scroll target not found: clip-${clipId}`);
    }
  };
  return (
    <Form
      key={storageKey}
      formSchema={Img2ImgSchema}
      defaultValues={defaultValues}
      onSubmit={submitRender}
      className="flex w-full h-full min-h-0 overflow-hidden bg-surface-secondary max-h-[var(--height-full-minus-img2img-navbar)]"
      data-testid="img2img-modal"
      ref={formRef}
    >
      <Img2ImgFormPersistence settingsAtom={settingsAtom} />
      <div className="w-img2img-settings flex flex-col flex-shrink-0">
        <div className="flex-1 border-r border-glyph-invert-main overflow-y-auto scrollbar-custom">
          {!isOnboardingActive && (
            <div className="p-3">
              <FieldSwitcher
                name="frameType"
                fullWidth
                options={[
                  {
                    label: t("img2imgForms.common.frame_type.from_video.label"),
                    value: "video"
                  },
                  {
                    label: t(
                      "img2imgForms.common.frame_type.image_upload.label"
                    ),
                    value: "upload"
                  }
                ]}
              />
            </div>
          )}
          <div className="flex flex-col gap-4 p-3">
            <Img2ImgFrameTypeContent
              currentFrame={clampedFrame}
              setCurrentFrame={handleSetFrame}
            />
          </div>
          {!isOnboardingActive && (
            <Divider className="!bg-glyph-stroke !my-2" />
          )}
          <div className="px-3 pb-3 flex flex-col gap-3">
            {!isOnboardingActive && (
              <>
                <Text component="h3" variant="sm" color="glyph-primary">
                  {t("titles.render_settings.label")}
                </Text>
                <CopyPasteReset />
              </>
            )}
            <div className="flex flex-col gap-4">
              {!isOnboardingActive && <ModelSelector />}
              <SwitchModelForms />
            </div>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-16 py-3 pl-3 pr-5 bg-surface-secondary border-t border-r border-glyph-invert-main backdrop-blur-[10px]">
          <GenerateButton currentFrame={clampedFrame} />
        </div>
      </div>
      {!isDrawMaskActive && (
        <div
          className="shrink-0 border-r border-glyph-invert-main flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out"
          style={{
            width: isListingOpen ? "var(--width-img2img-gen-img-panel)" : "48px"
          }}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <Text
              variant="md"
              weight="medium"
              whiteSpace="nowrap"
              overflow="hidden"
              className={cn(
                "transition-opacity duration-300",
                isListingOpen ? "opacity-100" : "opacity-0"
              )}
            >
              {t("titles.generated_images.label")}
            </Text>
            <IconActionButton
              icon={
                <Icon
                  iconSet="16"
                  iconName="chevron-right"
                  className={cn(
                    "transition-transform duration-300",
                    isListingOpen ? "rotate-180" : "rotate-0"
                  )}
                />
              }
              variant="dark"
              onPress={() => setIsListingOpen((prev) => !prev)}
              aria-label={t("actions.toggle_presets_list.label")}
            />
          </div>
          <div className={cn("flex-1 min-h-0", !isListingOpen && "hidden")}>
            <Img2ImgListing onClipClick={handleClipClick} />
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
        {isDrawMaskActive ? (
          <DrawMaskOverlay frameIdx={clampedFrame} />
        ) : (
          <Img2ImgRenders />
        )}
      </div>
    </Form>
  );
};
