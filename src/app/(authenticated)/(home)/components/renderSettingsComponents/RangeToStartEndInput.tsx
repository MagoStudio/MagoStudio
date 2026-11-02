import { ControlLabel } from "@components/ControlLabel";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { Input } from "@components/Input";

import { RenderSettingComponentProps } from "./interface";

export const RangeToStartEndInput: React.FC<
  RenderSettingComponentProps<number>
> = ({
  setValue,
  setSecondValue,
  name,
  label,
  tooltip,
  tooltipImage,
  isDisabled,
  max,
  min,
  step,
  value,
  secondValue
}) => {
  if (
    max === undefined ||
    min === undefined ||
    step === undefined ||
    !setSecondValue
  ) {
    throw new Error(
      "max, min, step and setSecondValue are required for RangeToStartEndInput"
    );
  }

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.trim() === "") {
      return;
    }

    const parsedValue = Number(e.target.value);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    setValue(parsedValue);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.trim() === "") {
      return;
    }

    const parsedValue = Number(e.target.value);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    setSecondValue(parsedValue);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const isStartInput = e.currentTarget.id === `${name}_start`;
    const isEndInput = e.currentTarget.id === `${name}_end`;
    const isClearedInput = e.currentTarget.value.trim() === "";

    let left =
      isStartInput && isClearedInput ? min : Number(value ?? min) || min;
    let right =
      isEndInput && isClearedInput ? max : Number(secondValue ?? max) || max;

    left = Math.max(min, Math.min(max, left));
    right = Math.max(min, Math.min(max, right));

    if (left >= right) {
      right = Math.min(left + step, max);
      if (left >= right) {
        left = Math.max(right - step, min);
      }
    }

    setValue(left);
    setSecondValue(right);
  };

  return (
    <div className="group grid grid-cols-12 gap-4 items-center">
      <div className="col-span-5">
        <ControlLabel labelColor="glyph-tertiary" label={label} />
      </div>
      <div className="col-span-7 flex items-center gap-1 pr-2">
        <div className="flex-1 flex gap-4 items-center">
          <Input
            id={`${name}_start`}
            disabled={isDisabled}
            readOnly={isDisabled}
            max={max}
            min={min}
            onChange={handleStartChange}
            onBlur={handleBlur}
            preserveEmptyWhileFocused
            step={step}
            type="number"
            value={value ?? min}
            selectAllTextOnFocus
          />
          <Input
            id={`${name}_end`}
            disabled={isDisabled}
            readOnly={isDisabled}
            max={max}
            min={min}
            onChange={handleEndChange}
            onBlur={handleBlur}
            preserveEmptyWhileFocused
            step={step}
            type="number"
            value={secondValue ?? max}
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
