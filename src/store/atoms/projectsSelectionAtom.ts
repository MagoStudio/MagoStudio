import { atom } from "jotai";

export const projectsSelectionAtom = atom<Set<string>>(new Set<string>());
