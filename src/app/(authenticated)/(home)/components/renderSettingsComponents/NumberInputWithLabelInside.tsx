import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { Text } from "@components/Text";

import { RenderSettingComponentProps } from "./interface";
import { getClampedValue } from "./utils/getClampedValue";

export const NumberInputWithLabelInside: React.FC<
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
    throw new Error("max and min are required for NumberInputWithLabelInside");
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.trim() === "") return;
    setValue(Number(event.target.value));
  };

  const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setValue(getClampedValue(Number(event.target.value), min, max));
  };

  return (
    <div className="flex h-8 w-full min-w-0 items-center gap-1.5 rounded-[4px] bg-element-primary pl-2 pr-2">
      <Text
        component="span"
        variant="sm"
        color="glyph-tertiary"
        select="none"
        className="shrink-0 whitespace-nowrap"
      >
        {label}
      </Text>
      <input
        id={name}
        type="number"
        disabled={isDisabled}
        readOnly={isDisabled}
        max={max}
        min={min}
        step={1}
        value={value ?? 0}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="min-w-0 flex-1 bg-transparent text-sm text-glyph-secondary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {tooltip && (
        <InfoTooltipIcon
          tooltip={tooltip}
          tooltipImage={tooltipImage}
          labelColor="glyph-tertiary"
        />
      )}
    </div>
  );
};
