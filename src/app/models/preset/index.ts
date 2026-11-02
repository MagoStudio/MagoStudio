import { closeUpShotsPreset } from "./presets/closeUpShots";
import { editingPreset } from "./presets/editing";
import { inpaintingPreset } from "./presets/inpainting";
import { replaceCharacterPreset } from "./presets/replaceCharacter";
import { replaceCharacterScenePreset } from "./presets/replaceCharacterScene";
import { replaceMultipleCharactersPreset } from "./presets/replaceMultipleCharacters";
import { seedancePreset } from "./presets/seedance";
import { styleTransferPreset } from "./presets/styleTransfer";
import { MagoPreset } from "./types";

export const MAGO_PRESETS: MagoPreset[] = [
  replaceCharacterPreset,
  replaceCharacterScenePreset,
  replaceMultipleCharactersPreset,
  closeUpShotsPreset,
  styleTransferPreset,
  inpaintingPreset,
  editingPreset,
  seedancePreset
];

export const DEFAULT_PRESET = styleTransferPreset;

export type { MagoPreset } from "./types";
