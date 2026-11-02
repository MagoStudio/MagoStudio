import { Text } from "@components/Text";

type DetailTone = "neutral" | "muted" | "success" | "warning" | "error";

const valueColorByTone = {
  neutral: "glyph-secondary",
  muted: "glyph-tertiary",
  success: "success",
  warning: "glyph-warning",
  error: "glyph-error"
} as const;

export const LocalSetupDetailRow = ({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: DetailTone;
}) => (
  <div className="flex items-center justify-between gap-2 border-b border-element-primary py-1.5">
    <Text component="span" variant="sm" color="glyph-secondary">
      {label}
    </Text>
    <Text component="span" variant="sm" color={valueColorByTone[tone]}>
      {value}
    </Text>
  </div>
);
