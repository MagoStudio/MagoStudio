import { atom } from "jotai";

export type MaskPreviewTool = "add" | "remove";

export interface MaskPreviewPoint {
  x: number;
  y: number;
  label: 0 | 1;
}

export const maskPreviewToolAtom = atom<MaskPreviewTool>("add");

export const maskViewportActiveAtom = atom<boolean>(false);
