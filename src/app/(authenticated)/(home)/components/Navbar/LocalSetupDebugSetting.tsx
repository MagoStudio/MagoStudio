import { Checkbox } from "@components/Checkbox";
import { Text } from "@components/Text";
import { useLocalSetupDebugSetting } from "@hooks/userLocalStorage/useLocalSetupDebugSetting";
import { useId } from "react";
import { useTranslation } from "react-i18next";

export const LocalSetupDebugSetting = () => {
  const { t } = useTranslation();
  const checkboxId = useId();
  const [isLocalSetupDebugEnabled, setIsLocalSetupDebugEnabled] =
    useLocalSetupDebugSetting();

  return (
    <div className="flex flex-col gap-1">
      <Checkbox
        inputId={checkboxId}
        isChecked={isLocalSetupDebugEnabled}
        onChange={(event) => setIsLocalSetupDebugEnabled(event.target.checked)}
        label={t("localSetup.debugSetting.label")}
      />
      <Text variant="2xs" color="glyph-tertiary">
        {t("localSetup.debugSetting.description")}
      </Text>
    </div>
  );
};
