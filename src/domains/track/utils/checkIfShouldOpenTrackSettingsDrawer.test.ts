import { Layer, LayerType } from "@schemas/layer";
import { describe, it, expect } from "vitest";

import { checkIfShouldOpenTrackSettingsDrawer } from "./checkIfShouldOpenTrackSettingsDrawer";

describe("checkIfShouldOpenTrackSettingsDrawer", () => {
  const createMockLayer = (overrides?: Partial<Layer>): Layer => ({
    active: true,
    clips: [],
    created_at: new Date("2024-01-01"),
    data: {} as any,
    id: "layer-1",
    layer_order: 0,
    muted: false,
    name: "Test Layer",
    rating: 0,
    timeline_id: "timeline-1",
    type: LayerType.RENDER,
    user_id: "user-1",
    visible: true,
    ...overrides
  });

  it("should return false when drawer is already open", () => {
    const clickedTrack = createMockLayer();
    const result = checkIfShouldOpenTrackSettingsDrawer(
      ["layer-1"],
      clickedTrack,
      true
    );
    expect(result).toBe(false);
  });

  it("should return false when multiple tracks are selected", () => {
    const clickedTrack = createMockLayer();
    const result = checkIfShouldOpenTrackSettingsDrawer(
      ["layer-1", "layer-2"],
      clickedTrack,
      false
    );
    expect(result).toBe(false);
  });

  it("should return false when there is already another track selected", () => {
    const clickedTrack = createMockLayer({ id: "layer-1" });
    const result = checkIfShouldOpenTrackSettingsDrawer(
      ["layer-2"],
      clickedTrack,
      false
    );
    expect(result).toBe(false);
  });

  it("should return false when clicked track the video track", () => {
    const clickedTrack = createMockLayer({
      id: "layer-1",
      type: LayerType.IMAGE.toUpperCase() as LayerType
    });
    const result = checkIfShouldOpenTrackSettingsDrawer(
      ["layer-1"],
      clickedTrack,
      false
    );
    expect(result).toBe(false);
  });

  it("should return false when track has clips (already rendered)", () => {
    const clickedTrack = createMockLayer({
      id: "layer-1",
      clips: [{ id: "clip-1" } as any]
    });
    const result = checkIfShouldOpenTrackSettingsDrawer(
      ["layer-1"],
      clickedTrack,
      false
    );
    expect(result).toBe(false);
  });

  it("should return true when all conditions are met", () => {
    const clickedTrack = createMockLayer({
      id: "layer-1",
      type: LayerType.RENDER,
      clips: []
    });
    const result = checkIfShouldOpenTrackSettingsDrawer(
      ["layer-1"],
      clickedTrack,
      false
    );
    expect(result).toBe(true);
  });
});
