import { atom } from "jotai";

export type HotkeyScope = "projectView" | "Img2ImgView" | "Img2ImgZoomView";

export const activeHotkeyAtom = atom<HotkeyScope>("projectView");
