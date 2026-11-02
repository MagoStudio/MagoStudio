import { ControlLabel } from "@components/ControlLabel";
import { Textarea } from "@components/Textarea";
import { AutoPrompt } from "@home/components/renderSettingsComponents/AutoPrompt";
import { AutoPromptVersion } from "@home/components/renderSettingsComponents/AutoPrompt/hooks/interface";
import { AutoPromptVersionEnum } from "@hooks/types";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

import { useRenderSettingFieldError } from "./hooks/useRenderSettingFieldError";
import { RenderSettingComponentProps } from "./interface";

type PromptProps = RenderSettingComponentProps<string | undefined> & {
  autoPromptVersion?: AutoPromptVersion;
};

const PROMPT_HEIGHT_FIVE_VISIBLE_LINES = "h-32";
const PROMPT_HEIGHT_TEN_VISIBLE_LINES = "h-62";

export const Prompt: React.FC<PromptProps> = ({
  name,
  label,
  tooltip,
  tooltipImage,
  tooltipFormat,
  tooltipImages,
  value,
  defaultValue,
  setValue,
  isDisabled,
  allValues,
  specificConfig,
  autoPromptVersion = AutoPromptVersionEnum.VIDEO2VIDEO_DEFAULT
}) => {
  const { t } = useTranslation();
  const fieldError = useRenderSettingFieldError(name, allValues);

  const styleReferenceImageId =
    typeof allValues?.source_image_slot === "string"
      ? allValues.source_image_slot
      : undefined;
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };
  const showAutoPrompt = name === "prompt" && !specificConfig?.hideAutoPrompt;
  const promptHeightClassName = specificConfig?.doubleHeight
    ? PROMPT_HEIGHT_TEN_VISIBLE_LINES
    : PROMPT_HEIGHT_FIVE_VISIBLE_LINES;

  const isCombinedMaskMode =
    allValues != null &&
    "mask_mode" in allValues &&
    allValues.mask_mode === "prompt_and_visual_selection";
  const customPlaceholder = specificConfig?.placeholder
    ? t(specificConfig.placeholder)
    : undefined;
  const plainTextTooltipFallback =
    tooltipFormat === "markdown" ? undefined : tooltip;
  const placeholder = isCombinedMaskMode
    ? t("masking.mask_mode_prompt_and_visual_selection.placeholder")
    : (customPlaceholder ?? plainTextTooltipFallback);

  return (
    <div key={name} className={"group flex flex-col gap-2"}>
      <div className="flex items-center justify-between">
        <ControlLabel
          inputId={name}
          label={label}
          labelColor="glyph-tertiary"
          tooltip={tooltip}
          tooltipImage={tooltipImage}
          tooltipFormat={tooltipFormat}
          tooltipImages={tooltipImages}
        />
      </div>
      {showAutoPrompt && (
        <AutoPrompt
          currentAutoPromptValue={value}
          defaultAutoPromptValue={defaultValue}
          disabled={isDisabled}
          onAutoPromptUpdate={setValue}
          styleReferenceImageId={styleReferenceImageId}
          version={autoPromptVersion}
        />
      )}
      <div className="flex w-full flex-col gap-4">
        <Textarea
          id={name}
          data-testid={name}
          className={cn(
            "min-h-16 placeholder:text-glyph-disabled",
            fieldError ? "!pr-8" : "!pr-3",
            promptHeightClassName
          )}
          disabled={isDisabled}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={isDisabled}
          resize="vertical"
          errorMessage={
            fieldError ? t(fieldError, { defaultValue: fieldError }) : undefined
          }
          severity={fieldError ? "error" : undefined}
          value={value ?? ""}
        />
      </div>
    </div>
  );
};
