import { SheetGroup } from "@schemas/scriptProject";

export const hasCharacterReadyVoice = (
  look: Pick<SheetGroup, "voice_signature">
): boolean => !!look.voice_signature?.voice_id;
