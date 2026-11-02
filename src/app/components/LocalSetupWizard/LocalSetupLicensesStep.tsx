import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type { LocalModelLicense } from "../../../../desktop/shared/localModelLicenses";

import { LocalModelLicenseList } from "./LocalModelLicenseList";
import { LocalSetupWizardActions } from "./LocalSetupWizardActions";
import { LocalSetupWizardCard } from "./LocalSetupWizardCard";

export const LocalSetupLicensesStep = ({
  licenses,
  isPending,
  error,
  onAccept
}: {
  licenses: LocalModelLicense[];
  isPending: boolean;
  error: string | null;
  onAccept: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <LocalSetupWizardCard>
      <Text variant="lg">{t("localSetup.licenses.title")}</Text>

      <LocalModelLicenseList licenses={licenses} />

      {error && (
        <Text variant="sm" color="glyph-error">
          {error}
        </Text>
      )}

      <LocalSetupWizardActions
        isPrimaryDisabled={isPending}
        primaryLabel={t("localSetup.licenses.accept")}
        onPrimaryPress={onAccept}
      />
    </LocalSetupWizardCard>
  );
};
