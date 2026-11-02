import { VideoSettings } from "@models/video/types";
import { createAsset } from "@tests/factories/asset";
import { describe, expect, it } from "vitest";

import { buildOptimisticTrackAssetData } from "./buildOptimisticTrackAssetData";

describe("buildOptimisticTrackAssetData", () => {
  const renderSettingsValues = {
    mago_engine: "v3.4.0",
    cfg: 1
  } as unknown as VideoSettings;
  const trackId = "layer-abc";

  it("derives duration as frameRange[1] - frameRange[0]", () => {
    const asset = createAsset();

    const assetData = buildOptimisticTrackAssetData({
      existingAssetData: asset.data,
      trackId,
      frameRange: [5, 25],
      renderSettingsValues,
      fps: 24
    });

    expect(assetData.duration).toBe(20);
  });

  it("derives a zero duration for a zero-length frame range", () => {
    const asset = createAsset();

    const assetData = buildOptimisticTrackAssetData({
      existingAssetData: asset.data,
      trackId,
      frameRange: [10, 10],
      renderSettingsValues,
      fps: 24
    });

    expect(assetData.duration).toBe(0);
  });

  it("sets data.parent_layer_id to the track id", () => {
    const asset = createAsset();

    const assetData = buildOptimisticTrackAssetData({
      existingAssetData: asset.data,
      trackId: "layer-abc",
      frameRange: [0, 10],
      renderSettingsValues,
      fps: 24
    });

    expect(assetData.data?.parent_layer_id).toBe("layer-abc");
    expect(assetData.data?.parent_layer_id).toBe(assetData.parent_render);
  });

  it("passes the caller-supplied fps through instead of a hardcoded value", () => {
    const asset = createAsset();

    const assetData = buildOptimisticTrackAssetData({
      existingAssetData: asset.data,
      trackId,
      frameRange: [0, 10],
      renderSettingsValues,
      fps: 30
    });

    expect(assetData.fps).toBe(30);
  });

  it("preserves pre-existing data.data fields alongside the new render_settings", () => {
    const asset = createAsset();
    asset.data = {
      ...asset.data,
      data: {
        ...asset.data.data,
        sources: { images: [{ asset_id: "ref-1", type: "reference_frame" }] }
      }
    };

    const assetData = buildOptimisticTrackAssetData({
      existingAssetData: asset.data,
      trackId,
      frameRange: [0, 10],
      renderSettingsValues,
      fps: 24
    });

    expect(assetData.data?.sources).toEqual({
      images: [{ asset_id: "ref-1", type: "reference_frame" }]
    });
    expect(assetData.data?.render_settings?.magov2).toEqual(
      renderSettingsValues
    );
  });

  it("does not overwrite a pre-seeded camelCase renderSettings mirror", () => {
    const asset = createAsset();
    asset.data = {
      ...asset.data,
      renderSettings: { magov2: { stale: true } }
    } as typeof asset.data;

    const assetData = buildOptimisticTrackAssetData({
      existingAssetData: asset.data,
      trackId,
      frameRange: [0, 10],
      renderSettingsValues,
      fps: 24
    });

    expect(assetData.renderSettings).toEqual({ magov2: { stale: true } });
    expect(assetData.data?.render_settings?.magov2).toEqual(
      renderSettingsValues
    );
  });

  it("does not introduce a camelCase renderSettings mirror when input has none", () => {
    const asset = createAsset();
    expect(asset.data.renderSettings).toBeUndefined();

    const assetData = buildOptimisticTrackAssetData({
      existingAssetData: asset.data,
      trackId,
      frameRange: [0, 10],
      renderSettingsValues,
      fps: 24
    });

    expect(assetData.renderSettings).toBeUndefined();
  });
});
