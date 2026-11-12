import { CircularProgress } from "@components/CircularProgress";
import { Text } from "@components/Text";
import { useTranslation } from "react-i18next";

import { modelOperationStatusColor } from "./modelOperationStatusColor";
import type {
  ModelSettingsOperation,
  ModelSettingsOperationSlot
} from "./modelSettingsOperation";

export const ModelOperationStatus = ({
  operation,
  slots
}: {
  operation: ModelSettingsOperation | null;
  slots: ModelSettingsOperationSlot[];
}) => {
  const { t } = useTranslation();
  if (!operation || !slots.includes(operation.slot)) return null;
  if (operation.outcome === "running")
    return (
      <div role="status" className="flex items-center gap-2">
        <span aria-hidden>
          <CircularProgress size="sm" color="glyph-tertiary" />
        </span>
        <Text variant="xs" color="glyph-tertiary">
          {t("modelSettings.operationRunning")}
        </Text>
      </div>
    );
  return (
    <div role="status" className="flex flex-col gap-1">
      {operation.outcome.map(({ status, message }) => (
        <Text
          key={`${status}:${message}`}
          variant="xs"
          color={modelOperationStatusColor[status]}
          className="wrap-anywhere"
        >
          {message}
        </Text>
      ))}
    </div>
  );
};
