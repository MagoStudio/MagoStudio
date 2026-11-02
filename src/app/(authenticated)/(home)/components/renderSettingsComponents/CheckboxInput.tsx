import { Checkbox } from "@components/Checkbox";
import { ControlLabel } from "@components/ControlLabel";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "./interface";

export const CheckboxInput: React.FC<RenderSettingComponentProps<boolean>> = ({
  setValue,
  name,
  label,
  tooltip,
  tooltipImage,
  tooltipFormat,
  tooltipImages,
  isDisabled,
  value,
  onValueChange
}) => {
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setValue(isChecked);
    onValueChange?.(name, isChecked);
  };

  return (
    <div className="group grid grid-cols-12 gap-4 items-center">
      <div className="col-span-5">
        <ControlLabel labelColor="glyph-tertiary" label={label} />
      </div>
      <div className="col-span-7 flex items-center gap-1 pr-2">
        <Checkbox
          boxed
          isChecked={value || false}
          inputId={`${name}-checkbox`}
          disabled={isDisabled}
          label={t("actions.checkbox.label")}
          onChange={handleChange}
        />
        {tooltip && (
          <InfoTooltipIcon
            tooltip={tooltip}
            tooltipImage={tooltipImage}
            tooltipFormat={tooltipFormat}
            tooltipImages={tooltipImages}
            labelColor="glyph-tertiary"
          />
        )}
      </div>
    </div>
  );
};
