import { VideoEngine } from "@models/video/types";
import { atom } from "jotai";

export const openNamedSectionsByModelAtom = atom<
  Partial<Record<VideoEngine, Set<string>>>
>({});
