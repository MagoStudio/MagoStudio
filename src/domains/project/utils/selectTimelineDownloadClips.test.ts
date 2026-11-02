import { TimelineShotEntry } from "@domains/project/useProjectTimelineData";
import { AssetStatus } from "@schemas/asset";
import { Layer, LayerType } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { selectPinnedClips } from "./selectTimelineDownloadClips";

const makeLayer = (
  id: string,
  type: LayerType,
  status: AssetStatus = AssetStatus.FINISHED,
  assetId = `${id}-asset`
): Layer =>
  ({
    id,
    type,
    clips: [{ asset_id: assetId, asset: { data: { queue_status: status } } }]
  }) as unknown as Layer;

const makeShot = (
  id: string,
  name: string,
  layers: Layer[],
  overrides: Partial<TimelineShotEntry> = {}
): TimelineShotEntry =>
  ({
    shot: { id, name, layers },
    durationFrames: 100,
    fps: 24,
    cumulativeStartFrame: 0,
    renderClip: undefined,
    renderOffset: 0,
    renderDuration: 0,
    ...overrides
  }) as unknown as TimelineShotEntry;

describe("selectPinnedClips", () => {
  it("returns only shots with a finished pinned render, in order", () => {
    const shots = [
      makeShot("s1", "01 A", [
        makeLayer("img1", LayerType.IMAGE),
        makeLayer("ren1", LayerType.RENDER)
      ]),
      makeShot("s2", "02 B", [makeLayer("img2", LayerType.IMAGE)])
    ];
    const pinned = { s1: "ren1" };

    const result = selectPinnedClips(shots, pinned);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      shotId: "s1",
      shotName: "01 A",
      layerId: "ren1",
      isPinnedRender: true
    });
  });

  it("excludes a pinned render that is not finished", () => {
    const shots = [
      makeShot("s1", "01 A", [
        makeLayer("ren1", LayerType.RENDER, AssetStatus.INPROGRESS)
      ])
    ];

    expect(selectPinnedClips(shots, { s1: "ren1" })).toHaveLength(0);
  });

  it("returns empty when nothing is pinned", () => {
    const shots = [
      makeShot("s1", "01 A", [makeLayer("img1", LayerType.IMAGE)])
    ];
    expect(selectPinnedClips(shots, {})).toHaveLength(0);
  });
});
