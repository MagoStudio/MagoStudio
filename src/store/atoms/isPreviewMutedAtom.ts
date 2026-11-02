import { atomWithStorage } from "jotai/utils";

export const isPreviewMutedAtom = atomWithStorage<boolean>(
  "mago-preview-muted",
  false
);
