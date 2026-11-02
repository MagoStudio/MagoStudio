import { atom } from "jotai";

export const trackRangeAtom = atom<[number, number]>([0, 0]);

export const invalidRangeAtom = atom<[number, number] | undefined>(undefined);
