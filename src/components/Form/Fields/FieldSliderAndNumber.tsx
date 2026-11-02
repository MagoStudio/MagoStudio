import { SliderAndNumberInput } from "@home/components/renderSettingsComponents/SliderAndNumberInput";
import React, { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";

type FieldSliderAndNumberProps = {
  name: string;
  label?: string;
  tooltip?: string;
  min?: number;
  max?: number;
  step?: number;
};

export function FieldSliderAndNumber(props: FieldSliderAndNumberProps) {
  const { name, ...rest } = props;
  const { setValue, formState } = useFormContext();
  const value = useWatch({ name });

  const handleChange = useCallback(
    (newValue: number | undefined) => {
      setValue(name, newValue, { shouldValidate: true });
    },
    [name, setValue]
  );

  return (
    <SliderAndNumberInput
      key={name}
      name={name}
      label={""}
      labelCaption={""}
      tooltip={""}
      value={value}
      defaultValue={value}
      setValue={handleChange}
      isDisabled={formState.disabled}
      {...rest}
      ariaLabel={props.label || ""}
    />
  );
}
