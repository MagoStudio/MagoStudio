const REFERENCE_INSTRUCTION_PREFIX =
  "Use the supplied reference images as follows: ";

export const buildSheetReferencePrompt = ({
  prompt,
  referenceInstruction
}: {
  prompt: string;
  referenceInstruction: string | null | undefined;
}): string => {
  const trimmedInstruction = referenceInstruction?.trim();
  if (!trimmedInstruction) return prompt;
  return `${prompt}\n\n${REFERENCE_INSTRUCTION_PREFIX}${trimmedInstruction}`;
};
