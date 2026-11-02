import { Layer } from "@schemas/layer";

import { getTrackClip } from "../getTrackClip";

export const getTimelineOffset = (track: Layer | null | undefined): number =>
  getTrackClip(track ?? undefined)?.data?.timeline_offset ?? 0;
