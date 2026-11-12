import { RadioControl } from "@components/RadioControl";
import { Text } from "@components/Text";
import { Radio, RadioGroup } from "react-aria-components";
import { useTranslation } from "react-i18next";

import type { LocalTextModelProvider } from "../../../../../../../desktop/shared/contracts";

export const LocalTextProviderRadios = ({
  value,
  onChange,
  cloudDisabled
}: {
  value: LocalTextModelProvider;
  onChange: (value: LocalTextModelProvider) => void;
  cloudDisabled: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <RadioGroup
      aria-label={t("localSettings.models.textModelLabel")}
      value={value}
      onChange={(next) => onChange(next as LocalTextModelProvider)}
      className="flex flex-col gap-2"
    >
      <div className="grid grid-cols-2 gap-2">
        {(["cloud", "local"] as const).map((provider) => (
          <Radio
            key={provider}
            value={provider}
            isDisabled={provider === "cloud" && cloudDisabled}
            className={({ isSelected, isDisabled }) =>
              `flex items-center gap-2 rounded border p-3 outline-hidden focus-visible:outline-1 focus-visible:outline-glyph-action-main ${isSelected ? "border-glyph-action-main" : "border-element-primary"} ${isDisabled ? "opacity-50" : "bg-element-primary"}`
            }
          >
            {(state) => (
              <>
                <RadioControl {...state} />
                <div className="flex flex-col gap-1">
                  <Text variant="sm" weight="bold">
                    {t(`modelSettings.provider.${provider}`)}
                  </Text>
                  <Text variant="2xs" color="glyph-tertiary">
                    {t(`modelSettings.provider.${provider}Hint`)}
                  </Text>
                </div>
              </>
            )}
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
};
