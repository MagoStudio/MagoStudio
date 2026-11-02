import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import type { LocalModelGroupStatus } from "../../../../desktop/shared/contracts";
import type { LocalModelGroupId } from "../../../../desktop/shared/localModelGroups";

import { LocalSetupModelGroupRow } from "./LocalSetupModelGroupRow";
import { LocalSetupWizardActions } from "./LocalSetupWizardActions";
import { LocalSetupWizardCard } from "./LocalSetupWizardCard";

export const LocalSetupModelsStep = ({
  modelGroups,
  isLoading,
  isPending,
  error,
  onToggleModelGroup,
  onContinue
}: {
  modelGroups: (LocalModelGroupStatus & {
    isChecked: boolean;
    isLocked: boolean;
  })[];
  isLoading: boolean;
  isPending: boolean;
  error: string | null;
  onToggleModelGroup: (groupId: LocalModelGroupId, isChecked: boolean) => void;
  onContinue: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <LocalSetupWizardCard>
      <Text variant="lg">{t("localSetup.models.title")}</Text>

      <Text variant="sm" color="glyph-secondary">
        {t("localSetup.models.description")}
      </Text>

      <div
        role="group"
        aria-label={t("localSetup.models.listLabel")}
        className="flex flex-col"
      >
        {modelGroups.map((group) => (
          <LocalSetupModelGroupRow
            key={group.groupId}
            groupId={group.groupId}
            state={group.state}
            missingBytes={group.missingBytes}
            isChecked={group.isChecked}
            isLocked={group.isLocked}
            onToggle={(isChecked) =>
              onToggleModelGroup(group.groupId, isChecked)
            }
          />
        ))}
      </div>

      {error && (
        <Text variant="sm" color="glyph-error">
          {error}
        </Text>
      )}

      <LocalSetupWizardActions
        isPrimaryDisabled={isLoading || isPending || modelGroups.length === 0}
        primaryLabel={t("localSetup.models.continue")}
        onPrimaryPress={onContinue}
      />
    </LocalSetupWizardCard>
  );
};
