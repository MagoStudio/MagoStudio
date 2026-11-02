import { SettingsLevel } from "@models/shared/types";
import { VideoEngine } from "@models/video/types";
import { atom } from "jotai";

export const openSettingsLevelsByModelAtom = atom<
  Partial<Record<VideoEngine, Set<SettingsLevel>>>
>({});
