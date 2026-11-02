import { Checkbox } from "@components/Checkbox";
import { Input } from "@components/Input";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "./interface";

const DEFAULT_NUMBER_VALUE = 1;
const DEFAULT_MAX = 20;

export const CheckboxOrNumberInput: React.FC<
  RenderSettingComponentProps<number>
> = ({
  setValue,
  name,
  isDisabled,
  value,
  max,
  min,
  specificConfig,
  onValueChange
}) => {
  const { t } = useTranslation();

  const valueIfChecked = specificConfig?.valueIfChecked as number;
  const isAllSelected = value === valueIfChecked;
  const checkboxLabel =
    specificConfig?.checkboxLabel ??
    t("actions.select_all_matching_objects.label");
  const numberMin = min !== undefined && min >= 0 ? min : 1;
  const numberMax = max ?? DEFAULT_MAX;

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    const newValue = isChecked ? valueIfChecked : DEFAULT_NUMBER_VALUE;
    setValue(newValue);
    onValueChange?.(name, newValue);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.trim() === "") {
      return;
    }

    const newValue = Number(e.target.value);
    setValue(newValue);
    onValueChange?.(name, newValue);
  };

  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = Math.min(
      Math.max(Number(e.target.value), numberMin),
      numberMax
    );
    setValue(newValue);
    onValueChange?.(name, newValue);
  };

  return (
    <div className="flex items-center gap-3">
      <Checkbox
        boxed
        isChecked={isAllSelected}
        inputId={`${name}-all-checkbox`}
        disabled={isDisabled}
        label={checkboxLabel}
        onChange={handleCheckboxChange}
      />
      <Text
        component="span"
        variant="sm"
        color="glyph-tertiary"
        className="shrink-0"
      >
        {t("titles.or.label")}
      </Text>
      <div className="w-20 shrink-0">
        <Input
          id={`${name}-number`}
          disabled={isDisabled || isAllSelected}
          readOnly={isDisabled || isAllSelected}
          max={numberMax}
          min={numberMin}
          onChange={handleNumberChange}
          onBlur={handleNumberBlur}
          preserveEmptyWhileFocused
          step={1}
          type="number"
          value={isAllSelected ? "" : value}
          placeholder="N&#176;"
          selectAllTextOnFocus
        />
      </div>
    </div>
  );
};
