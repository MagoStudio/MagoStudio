import {
  DropdownWithLabelInside,
  DropdownWithLabelInsideProps
} from "@components/DropdownWithLabelInside";
import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { DropdownItem, DropdownType } from "../../Dropdown";

interface FieldSelectProps<
  T extends DropdownItem,
  M extends DropdownType
> extends DropdownWithLabelInsideProps<T, M> {
  name: string;
}

export function FieldSelect<T extends DropdownItem, M extends DropdownType>(
  props: FieldSelectProps<T, M>
) {
  const { name, isDisabled, onChange: propsOnChange, ...rest } = props;
  const {
    setValue,
    formState: { errors, isValidating }
  } = useFormContext();
  const value = useWatch({ name });

  const handleChange = useCallback(
    (newValue: any) => {
      setValue(name, newValue, { shouldValidate: true });
      propsOnChange?.(newValue);
    },
    [name, setValue, propsOnChange]
  );

  const invalid = !!errors[name];

  return (
    <DropdownWithLabelInside
      {...rest}
      selectedKey={value}
      onSelectionChange={handleChange}
      name={name}
      isInvalid={invalid}
      isDisabled={isDisabled || isValidating}
    />
  );
}
