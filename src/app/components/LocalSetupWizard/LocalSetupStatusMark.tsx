import { Text } from "@components/Text";

const markByOutcome = {
  success: "✓",
  warning: "!",
  error: "✕"
} as const;

const colorByOutcome = {
  success: "success",
  warning: "glyph-warning",
  error: "glyph-error"
} as const;

export const LocalSetupStatusMark = ({
  outcome
}: {
  outcome: "success" | "warning" | "error";
}) => (
  <Text component="span" variant="lg" color={colorByOutcome[outcome]}>
    {markByOutcome[outcome]}
  </Text>
);
