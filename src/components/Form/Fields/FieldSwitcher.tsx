import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Switcher, SwitcherOption, SwitcherProps } from "../../Switcher";

type OptionalSwitcherProps<T> = Omit<
  SwitcherProps<T>,
  "isOptionSelected" | "onOptionClick"
> &
  Partial<Pick<SwitcherProps<T>, "isOptionSelected" | "onOptionClick">>;

interface FieldSwitcherProps<T> extends OptionalSwitcherProps<T> {
  name: string;
}

export function FieldSwitcher<T>(props: FieldSwitcherProps<T>) {
  const { name, onOptionClick: propsOnChange, ...rest } = props;
  const { setValue } = useFormContext();
  const value = useWatch({ name });

  const handleChange = useCallback(
    (option: SwitcherOption<T>) => {
      setValue(name, option.value, { shouldValidate: true });
      propsOnChange?.(option);
    },
    [name, setValue, propsOnChange]
  );

  return (
    <Switcher
      isOptionSelected={(option) => option.value === value}
      onOptionClick={handleChange}
      {...rest}
    />
  );
}
