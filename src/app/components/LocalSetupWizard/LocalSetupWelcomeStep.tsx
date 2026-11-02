import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import { LocalSetupDetailRow } from "./LocalSetupDetailRow";
import { LocalSetupWizardCard } from "./LocalSetupWizardCard";
import {
  LOCAL_SETUP_FILE_COUNT,
  LOCAL_SETUP_REQUIRED_GIGABYTES
} from "./localSetupWizardStubs";

export const LocalSetupWelcomeStep = ({
  onStart,
  onUseExistingComfy
}: {
  onStart: () => void;
  onUseExistingComfy: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <LocalSetupWizardCard>
      <Text variant="lg">{t("localSetup.welcome.title")}</Text>

      <Text variant="sm" color="glyph-secondary">
        {t("localSetup.welcome.description")}
      </Text>

      <LocalSetupDetailRow
        label={t("localSetup.welcome.hardwareLabel")}
        value={t("localSetup.welcome.hardwareEstimate")}
        tone="muted"
      />
      <LocalSetupDetailRow
        label={t("localSetup.welcome.modelsLabel")}
        value={t("localSetup.welcome.modelsEstimate")}
        tone="muted"
      />
      <LocalSetupDetailRow
        label={t("localSetup.welcome.storageLabel")}
        value={t("localSetup.welcome.storageEstimate", {
          gigabytes: LOCAL_SETUP_REQUIRED_GIGABYTES
        })}
        tone="muted"
      />
      <LocalSetupDetailRow
        label={t("localSetup.welcome.downloadLabel")}
        value={t("localSetup.welcome.downloadEstimate", {
          count: LOCAL_SETUP_FILE_COUNT
        })}
        tone="muted"
      />
      <div className="mt-auto flex flex-col gap-2">
        <MainButton fullWidth colorScheme="primary" onPress={onStart}>
          {t("localSetup.welcome.installComfy")}
        </MainButton>

        <MainButton
          fullWidth
          colorScheme="secondary"
          onPress={onUseExistingComfy}
        >
          {t("localSetup.welcome.useExistingComfy")}
        </MainButton>
      </div>
    </LocalSetupWizardCard>
  );
};
