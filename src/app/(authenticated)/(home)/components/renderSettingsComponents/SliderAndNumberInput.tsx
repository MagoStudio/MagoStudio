import { ControlLabel } from "@components/ControlLabel";
import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { Input } from "@components/Input";
import { Slider } from "@components/Slider";
import { forwardRef } from "react";

import { RenderSettingComponentProps } from "./interface";
import { getClampedValue } from "./utils/getClampedValue";

export const SliderAndNumberInput = forwardRef<
  HTMLDivElement,
  RenderSettingComponentProps<number>
>(
  (
    {
      setValue,
      name,
      label,
      tooltip,
      tooltipImage,
      isDisabled,
      max,
      min,
      step,
      value,
      defaultValue,
      specificConfig
    },
    ref
  ) => {
    if (max === undefined || min === undefined || step === undefined) {
      throw new Error(
        "max, min and step are required for SliderAndNumberInput"
      );
    }

    const unit = specificConfig?.unit as string | undefined;
    const resolvedValue = value ?? defaultValue ?? 0;

    const handleSliderChange = (newValue: number) => {
      const clampedValue = getClampedValue(newValue, min, max);
      setValue(clampedValue);
    };

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
      <div ref={ref} className="group grid grid-cols-12 gap-4 items-center">
        <div className="col-span-5">
          <ControlLabel labelColor="glyph-tertiary" label={label} />
        </div>
        <div className="col-span-7 flex items-center gap-1 pr-2">
          <div className="flex-1 flex gap-1 items-center">
            <Slider
              isDisabled={isDisabled}
              onChange={handleSliderChange}
              onChangeEnd={handleSliderChange}
              maxValue={max}
              minValue={min}
              size="md"
              step={step}
              value={resolvedValue}
            />
            <Input
              id={name}
              disabled={isDisabled}
              readOnly={isDisabled}
              max={max}
              min={min}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              preserveEmptyWhileFocused
              step={step}
              type="number"
              selectAllTextOnFocus
              value={resolvedValue}
              endCaption={unit}
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
  }
);

SliderAndNumberInput.displayName = "SliderAndNumberInput";
