import { AssetStatus } from "@schemas/asset";
import { LayerType } from "@schemas/layer";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { deriveShotCardState } from "./deriveShotCardState";

describe("deriveShotCardState", () => {
  it("returns notStarted for an empty layers array", () => {
    expect(deriveShotCardState([])).toBe("notStarted");
  });

  it("returns notStarted when the Shot has no Render Track", () => {
    const layers = [createLayer({ type: LayerType.IMAGE })];

    expect(deriveShotCardState(layers)).toBe("notStarted");
  });

  it("returns rendering when the Render Track is in progress", () => {
    const renderTrack = createLayer({ type: LayerType.RENDER });
    renderTrack.clips[0].asset.data.queue_status = AssetStatus.INPROGRESS;

    expect(deriveShotCardState([renderTrack])).toBe("rendering");
  });

  it("returns rendering when the Render Track is queued", () => {
    const renderTrack = createLayer({ type: LayerType.RENDER });
    renderTrack.clips[0].asset.data.queue_status = AssetStatus.INQUEUE;

    expect(deriveShotCardState([renderTrack])).toBe("rendering");
  });

  it("returns ready when the Render Track has a playable clip", () => {
    const renderTrack = createLayer({ type: LayerType.RENDER });
    renderTrack.clips[0].asset.data.queue_status = AssetStatus.FINISHED;

    expect(deriveShotCardState([renderTrack])).toBe("ready");
  });

  it("returns failed when the Render Track errored", () => {
    const renderTrack = createLayer({ type: LayerType.RENDER });
    renderTrack.clips[0].asset.data.queue_status = AssetStatus.ERROR;

    expect(deriveShotCardState([renderTrack])).toBe("failed");
  });

  it("returns failed when the Render Track was cancelled", () => {
    const renderTrack = createLayer({ type: LayerType.RENDER });
    renderTrack.clips[0].asset.data.queue_status = AssetStatus.CANCELLED;

    expect(deriveShotCardState([renderTrack])).toBe("failed");
  });

  it("returns ready when a playable Render Track outranks a failed one", () => {
    const failedRenderTrack = createLayer({ type: LayerType.RENDER });
    failedRenderTrack.clips[0].asset.data.queue_status = AssetStatus.ERROR;
    const playableRenderTrack = createLayer({ type: LayerType.RENDER });
    playableRenderTrack.clips[0].asset.data.queue_status = AssetStatus.FINISHED;

    expect(deriveShotCardState([failedRenderTrack, playableRenderTrack])).toBe(
      "ready"
    );
  });

  it("returns ready when a playable Render Track outranks a failed one, reversed order", () => {
    const playableRenderTrack = createLayer({ type: LayerType.RENDER });
    playableRenderTrack.clips[0].asset.data.queue_status = AssetStatus.FINISHED;
    const failedRenderTrack = createLayer({ type: LayerType.RENDER });
    failedRenderTrack.clips[0].asset.data.queue_status = AssetStatus.ERROR;

    expect(deriveShotCardState([playableRenderTrack, failedRenderTrack])).toBe(
      "ready"
    );
  });
});
