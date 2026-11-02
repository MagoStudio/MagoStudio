"use client";

import { Switcher, SwitcherOption } from "@components/Switcher";
import { TooltipIcon } from "@components/TooltipIcon";
import { useTooltip } from "@hooks/useTooltip";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "./interface";

export const MaskModeSelector: React.FC<
  RenderSettingComponentProps<string>
> = ({ setValue, value }) => {
  const { t } = useTranslation();
  const { visible, showTooltip, hideTooltip } = useTooltip();

  const options: SwitcherOption<string>[] = [
    {
      label: t("masking.mask_mode_prompt.label"),
      value: "prompt"
    },
    {
      label: t("masking.mask_mode_visual_selection.label"),
      value: "visual_selection"
    },
    {
      label: t("masking.mask_mode_prompt_and_visual_selection.label"),
      value: "prompt_and_visual_selection"
    }
  ];

  return (
    <div
      data-testid="mask-mode-selector"
      className="flex items-center gap-2 w-full"
    >
      <Switcher
        fullWidth
        options={options}
        onOptionClick={(option) => setValue(option.value)}
        isOptionSelected={(option) => option.value === value}
      />
      <div
        data-testid="mask-mode-info-icon"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        <TooltipIcon
          isVisible={visible}
          iconSize="sm"
          iconColor="glyph-secondary"
          variant="info"
        >
          {t("masking.mask_mode.tooltip")}
        </TooltipIcon>
      </div>
    </div>
  );
};
