import { Dropdown } from "@components/Dropdown";

import { RenderSettingComponentProps } from "./interface";

export const RenderSettingDropdown: React.FC<
  Pick<
    RenderSettingComponentProps<string>,
    "setValue" | "value" | "label" | "ariaLabel" | "isDisabled" | "options"
  >
> = ({ setValue, value, label, ariaLabel, isDisabled, options = [] }) => {
  const onOptionChange = (key: unknown) => {
    setValue(key as string);
  };

  return (
    <Dropdown
      aria-label={ariaLabel || label}
      isDisabled={isDisabled}
      onChange={onOptionChange}
      value={value}
      items={options.map((option) => ({ ...option, key: option.value }))}
    />
  );
};
