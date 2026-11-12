import { REFERENCE_INSTRUCTION_PREFIX } from "./buildSheetReferencePrompt";

export const VISUAL_STYLE_INSTRUCTION_PREFIX =
  "Apply only this visual treatment (medium, palette, texture, contrast, grain, and lighting treatment). Do not add or change any subject, character, object, setting, background, composition, or action based on this text: ";

const COMPOSED_SUFFIX_MARKERS = [
  `\n\n${REFERENCE_INSTRUCTION_PREFIX}`,
  `\n\n${VISUAL_STYLE_INSTRUCTION_PREFIX}`
];

export const stripSheetPromptComposedSuffixes = (prompt: string): string => {
  const firstSuffixIndex = Math.min(
    prompt.length,
    ...COMPOSED_SUFFIX_MARKERS.map((marker) => prompt.indexOf(marker)).filter(
      (markerIndex) => markerIndex >= 0
    )
  );
  return prompt.slice(0, firstSuffixIndex);
};
