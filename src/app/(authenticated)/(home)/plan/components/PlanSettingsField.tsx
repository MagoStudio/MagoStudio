import { Text } from "@components/Text";

interface PlanSettingsFieldProps {
  label: string;
  value: string;
}

export const PlanSettingsField: React.FC<PlanSettingsFieldProps> = ({
  label,
  value
}) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <Text variant="2xs" color="glyph-tertiary">
      {label}
    </Text>
    <Text variant="sm" color="glyph-primary" className="truncate">
      {value}
    </Text>
  </div>
);
