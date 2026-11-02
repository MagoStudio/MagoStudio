import { VideoSettings } from "@models/video/types";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { buildMockTrackDuringGeneration } from "./buildMockTrackDuringGeneration";

describe("buildMockTrackDuringGeneration", () => {
  const renderSettingsValues = {
    mago_engine: "v3.4.0",
    cfg: 1
  } as unknown as VideoSettings;
  const inputTrackId = "input-track-1";
  const fps = 24;

  it("writes render_settings only to the canonical snake_case asset path", () => {
    const track = createLayer();

    const mocked = buildMockTrackDuringGeneration({
      track,
      frameRange: [0, 10],
      renderSettingsValues,
      inputTrackId,
      fps
    });

    expect(mocked.clips[0].asset.data.data?.render_settings?.magov2).toEqual(
      renderSettingsValues
    );
  });

  it("does not introduce a camelCase mirror at asset.data.renderSettings when input has none", () => {
    const track = createLayer();
    expect(track.clips[0].asset.data.renderSettings).toBeUndefined();

    const mocked = buildMockTrackDuringGeneration({
      track,
      frameRange: [0, 10],
      renderSettingsValues,
      inputTrackId,
      fps
    });

    expect(mocked.clips[0].asset.data.renderSettings).toBeUndefined();
    expect(Object.keys(mocked.clips[0].asset.data)).not.toContain(
      "renderSettings"
    );
  });

  it("does not overwrite a pre-seeded camelCase mirror with the new render-settings values", () => {
    const track = createLayer();
    track.clips[0].asset.data = {
      ...track.clips[0].asset.data,
      renderSettings: { magov2: { stale: true } }
    } as (typeof track.clips)[0]["asset"]["data"];

    const mocked = buildMockTrackDuringGeneration({
      track,
      frameRange: [0, 10],
      renderSettingsValues,
      inputTrackId,
      fps
    });

    expect(mocked.clips[0].asset.data.renderSettings).toEqual({
      magov2: { stale: true }
    });
    expect(mocked.clips[0].asset.data.data?.render_settings?.magov2).toEqual(
      renderSettingsValues
    );
  });

  it("sets skeletonFrameRange on layer data", () => {
    const track = createLayer();

    const mocked = buildMockTrackDuringGeneration({
      track,
      frameRange: [5, 25],
      renderSettingsValues,
      inputTrackId,
      fps
    });

    expect(mocked.data.skeletonFrameRange).toEqual([5, 25]);
  });

  it("sets clips[0].data.sources.video to the input track id", () => {
    const track = createLayer();

    const mocked = buildMockTrackDuringGeneration({
      track,
      frameRange: [0, 10],
      renderSettingsValues,
      inputTrackId,
      fps
    });

    expect(mocked.clips[0].data.sources?.video).toBe(inputTrackId);
  });

  it("preserves existing clips[0].data.sources fields alongside video", () => {
    const track = createLayer();
    track.clips[0].data = {
      ...track.clips[0].data,
      sources: { images: [{ asset_id: "ref-1", type: "reference_frame" }] }
    };

    const mocked = buildMockTrackDuringGeneration({
      track,
      frameRange: [0, 10],
      renderSettingsValues,
      inputTrackId,
      fps
    });

    expect(mocked.clips[0].data.sources).toEqual({
      images: [{ asset_id: "ref-1", type: "reference_frame" }],
      video: inputTrackId
    });
  });

  it("agrees with the asset on duration for the same frame range", () => {
    const track = createLayer();

    const mocked = buildMockTrackDuringGeneration({
      track,
      frameRange: [5, 25],
      renderSettingsValues,
      inputTrackId,
      fps
    });

    expect(mocked.clips[0].data.duration).toBe(20);
    expect(mocked.clips[0].asset.data.duration).toBe(20);
  });

  it("sets asset.data.data.parent_layer_id to the track id, matching parent_render", () => {
    const track = createLayer({ id: "layer-abc" });

    const mocked = buildMockTrackDuringGeneration({
      track,
      frameRange: [0, 10],
      renderSettingsValues,
      inputTrackId,
      fps
    });

    expect(mocked.clips[0].asset.data.data?.parent_layer_id).toBe("layer-abc");
    expect(mocked.clips[0].asset.data.data?.parent_layer_id).toBe(
      mocked.clips[0].asset.data.parent_render
    );
  });

  it("sets asset.data.fps from the caller-supplied fps", () => {
    const track = createLayer();

    const mocked = buildMockTrackDuringGeneration({
      track,
      frameRange: [0, 10],
      renderSettingsValues,
      inputTrackId,
      fps: 30
    });

    expect(mocked.clips[0].asset.data.fps).toBe(30);
  });
});
