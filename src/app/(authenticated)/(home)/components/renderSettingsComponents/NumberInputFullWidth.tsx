import { ControlLabel } from "@components/ControlLabel";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { Input } from "@components/Input";

import { RenderSettingComponentProps } from "./interface";

const getClampedValue = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const NumberInputFullWidth: React.FC<
  RenderSettingComponentProps<number>
> = ({
  setValue,
  name,
  label,
  tooltip,
  tooltipImage,
  isDisabled,
  max,
  min,
  value
}) => {
  if (max === undefined || min === undefined) {
    throw new Error("max and min are required for NumberInputFullWidth");
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.trim() === "") {
      return;
    }

    const newValue = Number(e.target.value);
    setValue(newValue);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    const clampedValue = getClampedValue(newValue, min, max);
    setValue(clampedValue);
  };

  return (
    <div className="group grid grid-cols-12 gap-4 items-center">
      <div className="col-span-5">
        <ControlLabel labelColor="glyph-tertiary" label={label} />
      </div>
      <div className="col-span-7 flex items-center gap-1 pr-2">
        <div className="flex-1">
          <Input
            id={name}
            disabled={isDisabled}
            readOnly={isDisabled}
            max={max}
            min={min}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            preserveEmptyWhileFocused
            step={1}
            type="number"
            value={value ?? 0}
            selectAllTextOnFocus
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
