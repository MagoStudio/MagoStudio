import type { MiniMaxH3VfxLora } from "../../shared/minimaxH3VfxModes";

const nameSourceTagAndRenumberLaterTags = (
  prompt: string,
  tagKind: "Video" | "Audio",
  replacementPhrase: string
): string =>
  prompt.replace(
    new RegExp(`<${tagKind} (\\d+)>`, "g"),
    (_tag, tagNumberText: string) => {
      const tagNumber = Number(tagNumberText);
      return tagNumber === 1
        ? replacementPhrase
        : `<${tagKind} ${tagNumber - 1}>`;
    }
  );

export const buildMiniMaxH3VfxPrompt = ({
  prompt,
  lora,
  isSourceAudioGuided
}: {
  prompt: string;
  lora: MiniMaxH3VfxLora;
  isSourceAudioGuided: boolean;
}): string => {
  const isSourceClipGuided = lora.sourceClipPlacement === "guide";
  const promptWithSourceNamed = isSourceClipGuided
    ? nameSourceTagAndRenumberLaterTags(
        isSourceAudioGuided
          ? nameSourceTagAndRenumberLaterTags(
              prompt,
              "Audio",
              "the source soundtrack"
            )
          : prompt,
        "Video",
        "the source video"
      )
    : prompt;
  const trimmedPrompt = promptWithSourceNamed.trim();
  const { trigger } = lora;
  const doesPromptStartWithTrigger =
    !trigger || trimmedPrompt.toLowerCase().startsWith(trigger.toLowerCase());
  return doesPromptStartWithTrigger
    ? trimmedPrompt
    : `${trigger} ${trimmedPrompt}`.trim();
};
