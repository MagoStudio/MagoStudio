import { ControlLabel } from "@components/ControlLabel";
import { Input } from "@components/Input";
import { Slider } from "@components/Slider";
import { forwardRef } from "react";

import { RenderSettingComponentProps } from "./interface";
import { getClampedValue } from "./utils/getClampedValue";

export const SliderAndNumberInputFullWidth = forwardRef<
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
      specificConfig
    },
    ref
  ) => {
    if (max === undefined || min === undefined || step === undefined) {
      throw new Error(
        "max, min and step are required for SliderAndNumberInputFullWidth"
      );
    }

    const unit = specificConfig?.unit as string | undefined;

    const handleSliderChange = (newValue: number) => {
      setValue(getClampedValue(newValue, min, max));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.trim() === "") return;
      setValue(Number(e.target.value));
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      setValue(getClampedValue(newValue, min, max));
    };

    return (
      <div ref={ref} className="group flex flex-col gap-0.5 w-full">
        <ControlLabel
          labelColor="glyph-tertiary"
          label={label}
          tooltip={tooltip}
          tooltipImage={tooltipImage}
        />
        <div className="flex items-center gap-1">
          <Slider
            isDisabled={isDisabled}
            onChange={handleSliderChange}
            onChangeEnd={handleSliderChange}
            maxValue={max}
            minValue={min}
            size="md"
            step={step}
            value={value || 0}
          />
          <div className="shrink-0 w-20">
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
              value={value ?? 0}
              endCaption={unit}
            />
          </div>
        </div>
      </div>
    );
  }
);

SliderAndNumberInputFullWidth.displayName = "SliderAndNumberInputFullWidth";
