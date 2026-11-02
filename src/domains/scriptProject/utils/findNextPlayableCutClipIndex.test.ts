import { describe, expect, it } from "vitest";

import { CutTimelineClip } from "./buildCutTimelineClips";
import { findNextPlayableCutClipIndex } from "./findNextPlayableCutClipIndex";

const buildClip = (isClipPlayable: boolean): CutTimelineClip =>
  ({ isClipPlayable }) as CutTimelineClip;

describe("findNextPlayableCutClipIndex", () => {
  it("starts a cut on its first playable clip", () => {
    const clips = [buildClip(false), buildClip(false), buildClip(true)];

    expect(findNextPlayableCutClipIndex(clips, -1)).toBe(2);
  });

  it("steps over a run of clips with no render", () => {
    const clips = [
      buildClip(true),
      buildClip(false),
      buildClip(false),
      buildClip(true)
    ];

    expect(findNextPlayableCutClipIndex(clips, 0)).toBe(3);
  });

  it("reports the end of the cut when nothing playable is left", () => {
    const clips = [buildClip(true), buildClip(false)];

    expect(findNextPlayableCutClipIndex(clips, 0)).toBeNull();
  });

  it("reports the end of the cut for an empty timeline", () => {
    expect(findNextPlayableCutClipIndex([], -1)).toBeNull();
  });
});
