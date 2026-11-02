import { ControlLabel } from "@components/ControlLabel";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";

import { RenderSettingComponentProps } from "./interface";
import { RenderSettingDropdown } from "./RenderSettingDropdown";

export const SelectInput: React.FC<RenderSettingComponentProps<string>> = ({
  setValue,
  value,
  label,
  ariaLabel,
  tooltip,
  tooltipImage,
  isDisabled,
  options = []
}) => {
  return (
    <div className="group grid grid-cols-12 gap-4 items-center">
      <div className="col-span-5">
        <ControlLabel labelColor="glyph-tertiary" label={label} />
      </div>
      <div className="col-span-7 flex items-center gap-1 py-0.5 pr-2">
        <div className="flex-1 min-w-0">
          <RenderSettingDropdown
            setValue={setValue}
            value={value}
            label={label}
            ariaLabel={ariaLabel}
            isDisabled={isDisabled}
            options={options}
          />
        </div>
        {tooltip && (
          <InfoTooltipIcon
            tooltip={tooltip}
            tooltipImage={tooltipImage}
            labelColor="glyph-tertiary"
          />
        )}
      </div>
    </div>
  );
};
