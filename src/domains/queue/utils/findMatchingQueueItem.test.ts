import { type QueueItem } from "@hooks/queue/interface";
import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { findMatchingQueueItem } from "./findMatchingQueueItem";

const queueItem = (assetId: string): QueueItem =>
  ({ id: `q-${assetId}`, asset_id: assetId }) as QueueItem;

const trackWithClipAsset = (
  asset: { id?: string; data?: { parent_render?: string } } | undefined
): Layer => ({ clips: asset ? [{ asset }] : [] }) as unknown as Layer;

describe("findMatchingQueueItem", () => {
  it("matches on the clip asset id directly", () => {
    const items = [queueItem("other"), queueItem("asset-1")];
    const track = trackWithClipAsset({ id: "asset-1" });

    expect(findMatchingQueueItem(items, track)).toBe(items[1]);
  });

  it("falls back to the asset's parent_render for child renders", () => {
    const items = [queueItem("parent-1")];
    const track = trackWithClipAsset({
      id: "child-1",
      data: { parent_render: "parent-1" }
    });

    expect(findMatchingQueueItem(items, track)).toBe(items[0]);
  });

  it("matches a cloud render whose clip now carries the cloud asset id", () => {
    const items = [
      {
        id: "q-local",
        asset_id: "local-asset",
        cloud_asset_id: "cloud-asset"
      } as QueueItem
    ];
    const track = trackWithClipAsset({ id: "cloud-asset" });

    expect(findMatchingQueueItem(items, track)).toBe(items[0]);
  });

  it("matches a child render whose parent_render is the cloud asset id", () => {
    const items = [
      {
        id: "q-local",
        asset_id: "local-asset",
        cloud_asset_id: "cloud-parent"
      } as QueueItem
    ];
    const track = trackWithClipAsset({
      id: "child-1",
      data: { parent_render: "cloud-parent" }
    });

    expect(findMatchingQueueItem(items, track)).toBe(items[0]);
  });

  it("ignores a missing cloud asset id", () => {
    const items = [
      {
        id: "q-local",
        asset_id: "local-asset",
        cloud_asset_id: null
      } as QueueItem
    ];
    const track = trackWithClipAsset({ id: "" });

    expect(findMatchingQueueItem(items, track)).toBeUndefined();
  });

  it("returns undefined when no queue item matches", () => {
    const items = [queueItem("asset-1")];
    const track = trackWithClipAsset({ id: "asset-2" });

    expect(findMatchingQueueItem(items, track)).toBeUndefined();
  });

  it("returns undefined for an empty queue", () => {
    expect(
      findMatchingQueueItem([], trackWithClipAsset({ id: "asset-1" }))
    ).toBeUndefined();
  });

  it("returns undefined for an undefined queue", () => {
    expect(
      findMatchingQueueItem(undefined, trackWithClipAsset({ id: "asset-1" }))
    ).toBeUndefined();
  });

  it("returns undefined when the track has no clip asset", () => {
    const items = [queueItem("asset-1")];

    expect(
      findMatchingQueueItem(items, trackWithClipAsset(undefined))
    ).toBeUndefined();
    expect(findMatchingQueueItem(items, undefined)).toBeUndefined();
  });

  it("ignores queue items with no asset_id even if the clip asset id is falsy", () => {
    const items = [{ id: "q-empty", asset_id: "" } as QueueItem];
    const track = trackWithClipAsset({ id: "" });

    expect(findMatchingQueueItem(items, track)).toBeUndefined();
  });
});
