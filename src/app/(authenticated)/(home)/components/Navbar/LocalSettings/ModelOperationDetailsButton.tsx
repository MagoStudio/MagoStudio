import { useTranslation } from "react-i18next";

import { ModelOperationDetails } from "./ModelOperationDetails";
import { ModelSettingsInfoButton } from "./ModelSettingsInfoButton";
import type {
  ModelSettingsOperation,
  ModelSettingsOperationSlot
} from "./modelSettingsOperation";

export const ModelOperationDetailsButton = ({
  operation,
  slots
}: {
  operation: ModelSettingsOperation | null;
  slots: ModelSettingsOperationSlot[];
}) => {
  const { t } = useTranslation();
  const hasDetailsToShow =
    operation !== null &&
    slots.includes(operation.slot) &&
    operation.outcome !== "running" &&
    operation.outcome.some((outcome) => outcome.details);
  if (!hasDetailsToShow) return null;
  return (
    <ModelSettingsInfoButton
      ariaLabel={t("modelSettings.operationDetailsButton")}
      testId="model-operation-details-button"
    >
      <ModelOperationDetails operation={operation} slots={slots} />
    </ModelSettingsInfoButton>
  );
};
