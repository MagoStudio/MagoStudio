import { CloseButton } from "@components/CloseButton";
import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { ONBOARDING_SEARCH_PARAM } from "@config/constants";
import { ONBOARDING_TUTORIAL_VIDEO_ID } from "@domains/onboarding/constants";
import { useOnboardingProgress } from "@domains/onboarding/useOnboardingProgress";
import { TOOL_URL_PARAM } from "@hooks/tool/useTool";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useShallowRouter } from "@hooks/useShallowRouter";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "react-aria-components/Button";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";

const thumbnailSrc = `https://img.youtube.com/vi/${ONBOARDING_TUTORIAL_VIDEO_ID}/maxresdefault.jpg`;
const embedSrc = `https://www.youtube.com/embed/${ONBOARDING_TUTORIAL_VIDEO_ID}?autoplay=1&rel=0`;

export const OnboardingTutorialModal: React.FC = () => {
  const { t } = useTranslation();
  const [, setProgress] = useOnboardingProgress();
  const { replace } = useShallowRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = () => setHasStarted(true);

  const handleClose = () => {
    setProgress((prev) => ({ ...prev, step: "complete" }));
    trackingUtils.onboardingActions.finished();
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete(ONBOARDING_SEARCH_PARAM);
    params.set(TOOL_URL_PARAM, "render-video");
    replace(`${pathname}?${params.toString()}`);
  };

  useHotkeys("escape", () => handleClose(), { enabled: true }, [handleClose]);

  return (
    <div
      role="dialog"
      aria-label={t("titles.onboarding_tutorial.label")}
      className="animate-fade-slide-in fixed bottom-2 right-2 z-modal flex aspect-[746/504] w-[50vw] max-w-[746px] flex-col gap-6 rounded-[20px] border border-glyph-tertiary bg-surface-on-image-opacity-80 p-5 pb-10 shadow-[4px_20px_20px_0px_rgba(0,0,0,0.4)] backdrop-blur-[50px]"
    >
      <CloseButton className="absolute right-3 top-3" onPress={handleClose} />
      <Text
        component="h2"
        variant="xl"
        weight="bold"
        color="glyph-primary-on-pic"
        align="center"
        className="block max-w-[604px] self-center"
      >
        {t("titles.onboarding_tutorial.label")}
      </Text>
      <div className="min-h-0 w-full flex-1 overflow-hidden rounded-[20px] bg-surface-bg-300">
        {hasStarted ? (
          <iframe
            className="size-full"
            src={embedSrc}
            title={t("titles.onboarding_tutorial.label")}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <Button
            onPress={handleStart}
            aria-label={t("actions.play_tutorial.label")}
            className="group relative block size-full"
          >
            <img
              src={thumbnailSrc}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 size-full object-contain"
            />
            <span className="pointer-events-none absolute left-1/2 top-1/2 flex size-[60px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded bg-element-for-hover backdrop-blur-md transition-transform group-hover:scale-110">
              <Icon
                iconSet="24-filled"
                iconName="play-forward"
                className="size-[34px] text-glyph-primary-on-pic"
              />
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};
