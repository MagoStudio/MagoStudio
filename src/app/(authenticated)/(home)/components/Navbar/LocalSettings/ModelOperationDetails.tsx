import { Text } from "@components/Text";

import type {
  ModelSettingsOperation,
  ModelSettingsOperationSlot
} from "./modelSettingsOperation";

export const ModelOperationDetails = ({
  operation,
  slots
}: {
  operation: ModelSettingsOperation | null;
  slots: ModelSettingsOperationSlot[];
}) => {
  if (!operation || !slots.includes(operation.slot)) return null;
  if (operation.outcome === "running") return null;
  const outcomesWithDetails = operation.outcome.filter(
    (outcome) => outcome.details
  );
  if (outcomesWithDetails.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {outcomesWithDetails.map(({ status, message, details }) => (
        <Text
          key={`${status}:${message}`}
          variant="2xs"
          color="glyph-secondary"
          whiteSpace="pre-wrap"
          className="max-h-60 overflow-auto rounded bg-element-primary p-2 font-mono break-all"
        >
          {JSON.stringify(details, null, 2)}
        </Text>
      ))}
    </div>
  );
};
