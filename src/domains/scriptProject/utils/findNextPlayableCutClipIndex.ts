import { CutTimelineClip } from "./buildCutTimelineClips";

export const findNextPlayableCutClipIndex = (
  clips: CutTimelineClip[],
  fromIndex: number
): number | null => {
  for (let index = fromIndex + 1; index < clips.length; index += 1) {
    if (clips[index]!.isClipPlayable) return index;
  }

  return null;
};
