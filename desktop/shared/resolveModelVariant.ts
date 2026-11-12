import type { LocalModelDefinition, ModelPreferences } from "./modelSettings";

export const resolveModelVariant = (
  definition: LocalModelDefinition,
  preferences: ModelPreferences,
  setupTextVariant: string,
  workflowVariant?: string
) => {
  const requested =
    preferences.variant === "auto"
      ? setupTextVariant
      : preferences.variant === "default"
        ? workflowVariant
        : preferences.variant;
  return (
    definition.variants.find((variant) => variant.id === requested) ??
    definition.variants[0]
  );
};
