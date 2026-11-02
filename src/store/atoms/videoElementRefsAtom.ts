import { atom } from "jotai";

export const videoElementRefsAtom = atom<
  Record<string, HTMLVideoElement | null>
>({});
