import { ControlLabel } from "@components/ControlLabel";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { Input } from "@components/Input";

import { RenderSettingComponentProps } from "./interface";

export const TextInput: React.FC<RenderSettingComponentProps<string>> = ({
  value,
  setValue,
  label,
  tooltip,
  tooltipImage,
  isDisabled,
  defaultValue
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className="group grid grid-cols-12 gap-4 items-center">
      <div className="col-span-5">
        <ControlLabel labelColor="glyph-tertiary" label={label} />
      </div>
      <div className="col-span-7 flex items-center gap-1 pr-2">
        <div className="flex-1">
          <Input
            disabled={isDisabled}
            onChange={handleChange}
            value={value}
            defaultValue={defaultValue}
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
