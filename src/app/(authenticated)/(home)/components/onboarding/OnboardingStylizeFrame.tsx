import { FieldFileDropZone } from "@components/Form/Fields/FieldFileDropZone";
import { Form } from "@components/Form/Form";
import { Text } from "@components/Text";
import { useImg2ImgHistoryClips } from "@domains/track/useImg2ImgHistoryClips";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "usehooks-ts";

import { GenerateButton } from "../Navbar/Img2ImgModalV2/GenerateButton";
import { useImg2ImgRender } from "../Navbar/Img2ImgModalV2/hooks/useImg2ImgRender";
import { Img2ImgRenders } from "../Navbar/Img2ImgModalV2/Img2ImgRenders";
import { Img2ImgSchema, Img2ImgType } from "../Navbar/Img2ImgModalV2/schemas";

import { OnboardingFramePreview } from "./OnboardingFramePreview";
import { OnboardingPromptField } from "./OnboardingPromptField";

const FIRST_FRAME = 0;

const WIDE_SCREEN_QUERY = "(min-width: 1440px)";
const WIDE_SCREEN_COLUMNS = 3;
const DEFAULT_COLUMNS = 2;

export const OnboardingStylizeFrame: React.FC = () => {
  const { t } = useTranslation();
  const submitRender = useImg2ImgRender(FIRST_FRAME);
  const { inputTrackFrameSrc, isLoading: isFrameLoading } =
    useInputTrackFrameSrc({
      frameNumber: FIRST_FRAME
    });
  const {
    data: { sortedClips }
  } = useImg2ImgHistoryClips();
  const hasResults = sortedClips.length > 0;
  const isWideScreen = useMediaQuery(WIDE_SCREEN_QUERY);
  const resultsMaxColumns = isWideScreen
    ? WIDE_SCREEN_COLUMNS
    : DEFAULT_COLUMNS;

  const handleGenerate = (data: Img2ImgType) => {
    if (!hasResults) trackingUtils.onboardingActions.firstImg2img();
    return submitRender(data);
  };

  const defaultValues = {
    ...Img2ImgSchema.parse({ model: "gpt_image_2" }),
    prompt: t("titles.onboarding_image_step.default_prompt")
  } as Img2ImgType;

  const promptLabel = (
    <Text variant="sm" color="glyph-secondary">
      {t("titles.onboarding_image_step.label")}
    </Text>
  );

  const referenceField = (
    <FieldFileDropZone
      name="referenceImages"
      text={t("titles.onboarding_style_reference.label")}
      hintText=""
      maxFileUpload={1}
    />
  );

  const generateButton = (
    <GenerateButton
      label={t("actions.generate_frame.label")}
      currentFrame={FIRST_FRAME}
    />
  );

  return (
    <Form
      formSchema={Img2ImgSchema}
      defaultValues={defaultValues}
      onSubmit={handleGenerate}
      className="flex min-h-0 w-full flex-1 flex-col bg-surface-primary"
    >
      {hasResults ? (
        <div className="flex min-h-0 w-full flex-1">
          <div className="flex h-full w-img2img-settings shrink-0 flex-col gap-4 border-r border-glyph-invert-main p-4">
            <Text
              component="h3"
              variant="md"
              weight="medium"
              color="glyph-primary"
            >
              {t("titles.render_settings.label")}
            </Text>
            <OnboardingFramePreview
              src={inputTrackFrameSrc}
              variant="column"
              isLoading={isFrameLoading}
            />
            {promptLabel}
            <OnboardingPromptField className="h-40" />
            <div className="[&>div]:!gap-0">{referenceField}</div>
            <div className="mt-auto">{generateButton}</div>
          </div>
          <div className="min-h-0 flex-1">
            <Img2ImgRenders maxColumns={resultsMaxColumns} />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-4 px-5 py-8">
          <Text
            component="h1"
            weight="normal"
            color="glyph-primary"
            align="center"
            className="font-syne text-[40px] leading-[44px] tracking-[-0.4px]"
          >
            {t("titles.onboarding_stylize_header.label")}
          </Text>
          <div className="flex min-h-0 w-full flex-1 items-center justify-center [container-type:size]">
            <div className="aspect-[376/194] w-[min(100%,calc(100cqh*376/194))]">
              <OnboardingFramePreview
                src={inputTrackFrameSrc}
                isLoading={isFrameLoading}
              />
            </div>
          </div>
          <div className="flex w-full max-w-[456px] flex-col gap-4">
            <div className="flex flex-col gap-2">
              {promptLabel}
              <div className="flex items-start gap-2">
                <div className="h-[148px] flex-1 [&>div]:h-full [&_textarea]:!h-full">
                  <OnboardingPromptField />
                </div>
                <div className="h-[148px] w-[154px] shrink-0 [&>div]:h-full [&>div]:!gap-0 [&>div>div:last-child]:h-full [&_[data-rac]]:h-full [&_button]:!h-full [&_button]:!px-1.5 [&_button]:!py-0 [&_button_p]:!text-sm">
                  {referenceField}
                </div>
              </div>
            </div>
            {generateButton}
          </div>
        </div>
      )}
    </Form>
  );
};
