import { DropdownWithLabelInside } from "@components/DropdownWithLabelInside";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { VideoEngine } from "@models/video/types";
import { controlNetDisclosureOpenByModelAtom } from "@store/atoms";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { RenderSettingComponentProps } from "./interface";

export const ControlNetTypeSelector: React.FC<
  RenderSettingComponentProps<string>
> = ({
  setValue,
  value,
  label,
  ariaLabel,
  isDisabled,
  allValues,
  options = []
}) => {
  const { t } = useTranslation();
  const modelName = allValues?.mago_engine as VideoEngine | undefined;
  const [controlNetDisclosureOpenByModel, setControlNetDisclosureOpenByModel] =
    useAtom(controlNetDisclosureOpenByModelAtom);
  const isOtherSettingsOpen = modelName
    ? (controlNetDisclosureOpenByModel[modelName] ?? false)
    : false;

  const onOptionChange = (key: unknown) => {
    setValue(key as string);
  };

  const toggleOtherSettings = () => {
    if (!modelName) return;
    setControlNetDisclosureOpenByModel((previous) => ({
      ...previous,
      [modelName]: !(previous[modelName] ?? false)
    }));
  };

  return (
    <div className="group flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <DropdownWithLabelInside
          aria-label={ariaLabel}
          label={label}
          isDisabled={isDisabled}
          onChange={onOptionChange}
          value={value}
          items={options.map((option) => ({ ...option, key: option.value }))}
        />
      </div>
      <IconActionButton
        aria-label={t("titles.other_settings.label")}
        aria-expanded={isOtherSettingsOpen}
        size="sm"
        variant="dark"
        icon={<Icon iconSet="24" iconName="render-settings" />}
        isDisabled={isDisabled}
        className={isOtherSettingsOpen ? "text-glyph-primary" : undefined}
        onPress={toggleOtherSettings}
      />
    </div>
  );
};
