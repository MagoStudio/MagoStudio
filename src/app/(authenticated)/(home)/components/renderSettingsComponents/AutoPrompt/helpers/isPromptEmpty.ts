export const isPromptEmpty = (
  prompt?: string,
  defaultPrompt?: string
): boolean => {
  if (!prompt) return true;
  const trimmed = prompt.trim();
  return !trimmed || trimmed === defaultPrompt?.trim();
};
