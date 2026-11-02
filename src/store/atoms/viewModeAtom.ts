import { atom } from "jotai";

export enum PreviewMode {
  SINGLE = "singlePreview",
  SBS = "sbs",
  TWO = "twoPreviews"
}

export const viewModeAtom = atom<PreviewMode>(PreviewMode.SINGLE);
