import { SheetGroup, ShotDialogueTurn } from "@schemas/scriptProject";

import { doCharacterNameAliasesMatch } from "./doCharacterNameAliasesMatch";
import { hasCharacterReadyVoice } from "./hasCharacterReadyVoice";
import { listCharacterNameAliases } from "./listCharacterNameAliases";

export const findLooksNamedAsSpeaker = (
  speaker: string,
  characterLooks: SheetGroup[]
): SheetGroup[] => {
  const speakerAliases = listCharacterNameAliases(speaker);
  return characterLooks.filter((look) =>
    listCharacterNameAliases(look.name).some((lookAlias) =>
      speakerAliases.some((speakerAlias) =>
        doCharacterNameAliasesMatch(speakerAlias, lookAlias)
      )
    )
  );
};

const resolveVoicedSpeakerToken = (
  looksNamedAsSpeaker: SheetGroup[],
  connectedCharacterTokens: ReadonlySet<string>
): string | undefined => {
  const connectedLooks = looksNamedAsSpeaker.filter((look) =>
    connectedCharacterTokens.has(look.token)
  );
  if (!connectedLooks.length) return undefined;
  return (connectedLooks.find(hasCharacterReadyVoice) ?? connectedLooks[0]!)
    .token;
};

export const linkDialogueSpeakersToConnectedVoices = ({
  dialogue,
  connectedCharacterTokens,
  characterLooks
}: {
  dialogue: ShotDialogueTurn[];
  connectedCharacterTokens: ReadonlySet<string>;
  characterLooks: SheetGroup[];
}): ShotDialogueTurn[] =>
  dialogue.map((turn) => {
    const isTurnSpeakerTaggedInScene =
      !!turn.speaker_token && connectedCharacterTokens.has(turn.speaker_token);
    if (isTurnSpeakerTaggedInScene) return turn;
    const speaker = turn.speaker?.trim();
    if (!speaker) return turn;
    const voicedSpeakerToken = resolveVoicedSpeakerToken(
      findLooksNamedAsSpeaker(speaker, characterLooks),
      connectedCharacterTokens
    );
    return voicedSpeakerToken
      ? { ...turn, speaker_token: voicedSpeakerToken }
      : turn;
  });
