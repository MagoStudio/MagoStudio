import { DashedBorderOverlay } from "@components/DashedBorderOverlay";
import { LoadingIndicator } from "@components/LoadingIndicator";
import { Text } from "@components/Text";
import { UploadButtonGlyph } from "@components/UploadButtonGlyph";
import { useStartOnboardingFromTemplate } from "@domains/onboarding/useStartOnboardingFromTemplate";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useAddVideo } from "@hooks/useAddVideo";
import { addVideoRequestAtom } from "@store/atoms";
import { useAtomValue } from "jotai";
import { Button } from "react-aria-components/Button";
import { DropZone } from "react-aria-components/DropZone";
import { FileTrigger } from "react-aria-components/FileTrigger";
import { FileDropItem } from "react-aria-components/GridList";
import { useTranslation } from "react-i18next";

import { OnboardingTemplateVideos } from "./OnboardingTemplateVideos";

const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const OnboardingUploadStep: React.FC = () => {
  const { t } = useTranslation();
  const { addVideoFiles } = useAddVideo();
  const { startFromTemplate, isPending } = useStartOnboardingFromTemplate();
  const isTrimModalOpen = useAtomValue(addVideoRequestAtom) !== null;

  const handleTemplateSelect = (shotName: string) => {
    trackingUtils.onboardingActions.videoSelected("template");
    startFromTemplate(shotName);
  };

  const handleUserUpload = (files: File[]) => {
    if (files.length === 0) return;
    trackingUtils.onboardingActions.videoSelected("user_upload");
    addVideoFiles(files);
  };

  if (isTrimModalOpen) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full py-[50px]">
      <div
        data-testid="onboarding-upload-modal"
        className="relative flex w-full max-w-[clamp(880px,calc(80vw_-_144px),1392px)] flex-1 min-h-0 flex-col gap-6 rounded-[20px] bg-surface-secondary px-5 py-8 backdrop-blur-[50px]"
      >
        <div className="flex h-[60px] shrink-0 flex-col items-center justify-center py-2">
          <Text
            component="h1"
            weight="normal"
            color="glyph-primary"
            align="center"
            className="font-syne text-[40px] leading-[44px] tracking-[-0.4px]"
          >
            {t("titles.onboarding_upload.label")}
          </Text>
        </div>
        <OnboardingTemplateVideos
          onSelect={handleTemplateSelect}
          isDisabled={isPending}
        />
        <div className="flex w-full flex-1 flex-col gap-4">
          <Text
            component="p"
            weight="normal"
            color="glyph-secondary"
            className="text-[20px] leading-[32px]"
          >
            {t("titles.onboarding_upload.or_upload")}
          </Text>
          <DropZone
            data-testid="onboarding-upload-dropzone"
            isDisabled={isPending}
            className="group relative w-full flex-1 min-h-[240px] overflow-hidden rounded-[20px] bg-element-primary data-[drop-target]:bg-element-success/10"
            getDropOperation={(types) =>
              ACCEPTED_VIDEO_TYPES.some((type) => types.has(type))
                ? "copy"
                : "cancel"
            }
            onDrop={async (e) => {
              const fileItems = e.items.filter(
                (item) => item.kind === "file"
              ) as FileDropItem[];
              const files = await Promise.all(
                fileItems.map((item) => item.getFile())
              );
              handleUserUpload(files);
            }}
          >
            <DashedBorderOverlay cornerSize="lg" />
            <FileTrigger
              acceptedFileTypes={["video/*"]}
              onSelect={(files) => {
                if (!files) return;
                handleUserUpload(Array.from(files));
              }}
            >
              <Button
                isDisabled={isPending}
                className="flex h-full w-full flex-col items-center justify-center gap-5 px-6"
              >
                <UploadButtonGlyph />
                <div className="flex flex-col items-center text-center">
                  <Text
                    component="p"
                    weight="normal"
                    color="glyph-primary"
                    className="text-[20px] leading-[32px]"
                  >
                    {t("titles.onboarding_upload.description")}
                  </Text>
                  <Text
                    component="p"
                    weight="normal"
                    color="glyph-tertiary"
                    className="text-[13px] leading-[20px]"
                  >
                    {t("titles.onboarding_upload.hint")}
                  </Text>
                </div>
              </Button>
            </FileTrigger>
          </DropZone>
        </div>
        {isPending && (
          <div
            data-testid="onboarding-template-loading"
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface-secondary/70 backdrop-blur-sm"
          >
            <LoadingIndicator />
          </div>
        )}
      </div>
    </div>
  );
};
