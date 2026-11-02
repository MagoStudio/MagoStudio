import { atom } from "jotai";

import { DEFAULT_ZOOM_INDEX } from "./constants";

export const projectTimelineFrameAtom = atom<number>(0);
export const projectTimelinePlayingAtom = atom<boolean>(false);
export const projectTimelineZoomIndexAtom = atom<number>(DEFAULT_ZOOM_INDEX);
