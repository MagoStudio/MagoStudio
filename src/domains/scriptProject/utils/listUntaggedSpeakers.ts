import { SheetGroup } from "@schemas/scriptProject";

export type UntaggedSpeaker = { token: string; name: string };

export const listUntaggedSpeakers = (
  untaggedSpeakerTokens: string[],
  sheetGroups: SheetGroup[]
): UntaggedSpeaker[] =>
  untaggedSpeakerTokens.map((token) => ({
    token,
    name:
      sheetGroups.find((sheetGroup) => sheetGroup.token === token)?.name ??
      token
  }));
