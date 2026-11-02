import { atom } from "jotai";

export interface AddVideoRequest {
  file: File;
  existingProjectId?: string;
}

export const addVideoRequestAtom = atom<AddVideoRequest | null>(null);
