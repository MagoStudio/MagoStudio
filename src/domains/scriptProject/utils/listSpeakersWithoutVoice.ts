import { SheetGroup, ShotDialogueTurn } from "@schemas/scriptProject";

import { hasCharacterReadyVoice } from "./hasCharacterReadyVoice";
import { findLooksNamedAsSpeaker } from "./linkDialogueSpeakersToConnectedVoices";

export const listSpeakersWithoutVoice = ({
  dialogue,
  connectedCharacterTokens,
  characterLooks
}: {
  dialogue: ShotDialogueTurn[];
  connectedCharacterTokens: ReadonlySet<string>;
  characterLooks: SheetGroup[];
}): string[] => {
  const characterNamesWithoutVoice = new Set<string>();
  for (const turn of dialogue) {
    const taggedSpeakerLook = turn.speaker_token
      ? characterLooks.find(
          (look) =>
            look.token === turn.speaker_token &&
            connectedCharacterTokens.has(look.token)
        )
      : undefined;
    if (taggedSpeakerLook) {
      if (!hasCharacterReadyVoice(taggedSpeakerLook))
        characterNamesWithoutVoice.add(taggedSpeakerLook.name);
      continue;
    }
    const speaker = turn.speaker?.trim();
    if (!speaker) continue;
    const connectedLooks = findLooksNamedAsSpeaker(
      speaker,
      characterLooks
    ).filter((look) => connectedCharacterTokens.has(look.token));
    const isVoicedInThisScene = connectedLooks.some(hasCharacterReadyVoice);
    if (connectedLooks.length && !isVoicedInThisScene)
      characterNamesWithoutVoice.add(connectedLooks[0]!.name);
  }
  return [...characterNamesWithoutVoice];
};
