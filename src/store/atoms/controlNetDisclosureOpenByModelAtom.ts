import { VideoEngine } from "@models/video/types";
import { atom } from "jotai";

export const controlNetDisclosureOpenByModelAtom = atom<
  Partial<Record<VideoEngine, boolean>>
>({});
