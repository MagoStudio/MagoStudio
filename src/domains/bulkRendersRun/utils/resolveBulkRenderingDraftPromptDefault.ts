export interface ResolveBulkRenderingDraftPromptDefaultInput {
  storedPromptValue: unknown;
  modelDefaultPrompt: string;
}

export const resolveBulkRenderingDraftPromptDefault = ({
  storedPromptValue,
  modelDefaultPrompt
}: ResolveBulkRenderingDraftPromptDefaultInput): string => {
  const explicitStoredPrompt =
    typeof storedPromptValue === "string" ? storedPromptValue : "";
  return explicitStoredPrompt || modelDefaultPrompt;
};
