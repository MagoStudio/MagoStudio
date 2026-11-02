import { Switch } from "@components/Switch";
import { Text } from "@components/Text";

import { RenderSettingComponentProps } from "./interface";

export const SwitchInput: React.FC<RenderSettingComponentProps<boolean>> = ({
  setValue,
  name,
  label,
  ariaLabel,
  tooltip,
  isDisabled,
  value,
  onValueChange
}) => {
  const handleChange = (isSelected: boolean) => {
    setValue(isSelected);
    onValueChange?.(name, isSelected);
  };

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex flex-col gap-0.5">
        <Text color="glyph-secondary" component="span" variant="sm">
          {label}
        </Text>
        {tooltip && (
          <Text color="glyph-disabled" component="span" variant="xs">
            {tooltip}
          </Text>
        )}
      </div>
      <Switch
        ariaLabel={ariaLabel || label}
        isSelected={value ?? false}
        onChange={handleChange}
        isDisabled={isDisabled}
      />
    </div>
  );
};
