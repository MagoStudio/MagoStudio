import { VideoSettings } from "@models/video/types";
import { createAsset } from "@tests/factories/asset";
import { createClip } from "@tests/factories/clip";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { buildMockImageToVideoTrackDuringGeneration } from "./buildMockImageToVideoTrackDuringGeneration";

describe("buildMockImageToVideoTrackDuringGeneration", () => {
  const renderSettingsValues = {
    mago_engine: "seedance_2_i2v",
    prompt: "A cat walking"
  } as unknown as VideoSettings;
  const fps = 24;

  it("gives the fresh track a single clip so it counts as an eligible render track", () => {
    const track = createLayer({ clips: [] });

    const mocked = buildMockImageToVideoTrackDuringGeneration({
      track,
      frameRange: [0, 120],
      renderSettingsValues,
      fps
    });

    expect(mocked.clips).toHaveLength(1);
  });

  it("writes render_settings onto the mocked clip's asset", () => {
    const track = createLayer({ clips: [] });

    const mocked = buildMockImageToVideoTrackDuringGeneration({
      track,
      frameRange: [0, 120],
      renderSettingsValues,
      fps
    });

    expect(mocked.clips[0].asset.data.data?.render_settings?.magov2).toEqual(
      renderSettingsValues
    );
  });

  it("sets skeletonFrameRange on the layer data", () => {
    const track = createLayer({ clips: [] });

    const mocked = buildMockImageToVideoTrackDuringGeneration({
      track,
      frameRange: [0, 120],
      renderSettingsValues,
      fps
    });

    expect(mocked.data.skeletonFrameRange).toEqual([0, 120]);
  });

  it("leaves the placeholder clip without an asset id so no asset fetch is attempted", () => {
    const track = createLayer({ clips: [] });

    const mocked = buildMockImageToVideoTrackDuringGeneration({
      track,
      frameRange: [0, 120],
      renderSettingsValues,
      fps
    });

    expect(mocked.clips[0].asset_id).toBe("");
    expect(mocked.clips[0].asset.id).toBe("");
  });

  it("keeps the real asset id when the track already has a clip", () => {
    const asset = createAsset({ id: "real-output-asset" });
    const track = createLayer({
      clips: [createClip({ asset_id: asset.id, asset })]
    });

    const mocked = buildMockImageToVideoTrackDuringGeneration({
      track,
      frameRange: [0, 120],
      renderSettingsValues,
      fps
    });

    expect(mocked.clips[0].asset_id).toBe("real-output-asset");
  });

  it("does not introduce a sources.video field, unlike the video-to-video mock", () => {
    const track = createLayer({ clips: [] });

    const mocked = buildMockImageToVideoTrackDuringGeneration({
      track,
      frameRange: [0, 120],
      renderSettingsValues,
      fps
    });

    expect(mocked.clips[0].data.sources).toBeUndefined();
  });

  it("agrees with the asset on duration for the same frame range", () => {
    const track = createLayer({ clips: [] });

    const mocked = buildMockImageToVideoTrackDuringGeneration({
      track,
      frameRange: [5, 25],
      renderSettingsValues,
      fps
    });

    expect(mocked.clips[0].data.duration).toBe(20);
    expect(mocked.clips[0].asset.data.duration).toBe(20);
  });

  it("sets asset.data.data.parent_layer_id to the track id, matching parent_render", () => {
    const track = createLayer({ id: "layer-abc", clips: [] });

    const mocked = buildMockImageToVideoTrackDuringGeneration({
      track,
      frameRange: [0, 120],
      renderSettingsValues,
      fps
    });

    expect(mocked.clips[0].asset.data.data?.parent_layer_id).toBe("layer-abc");
    expect(mocked.clips[0].asset.data.data?.parent_layer_id).toBe(
      mocked.clips[0].asset.data.parent_render
    );
  });

  it("sets asset.data.fps from the caller-supplied fps", () => {
    const track = createLayer({ clips: [] });

    const mocked = buildMockImageToVideoTrackDuringGeneration({
      track,
      frameRange: [0, 120],
      renderSettingsValues,
      fps: 30
    });

    expect(mocked.clips[0].asset.data.fps).toBe(30);
  });
});
