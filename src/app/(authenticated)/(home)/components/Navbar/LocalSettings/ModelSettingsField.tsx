import { Text } from "@components/Text";
import type { ReactNode } from "react";

export const ModelSettingsField = ({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) => (
  <label className="flex min-w-0 flex-col gap-1">
    <Text component="span" variant="xs" color="glyph-secondary">
      {label}
    </Text>
    {children}
    {hint && (
      <Text component="span" variant="2xs" color="glyph-tertiary">
        {hint}
      </Text>
    )}
  </label>
);
