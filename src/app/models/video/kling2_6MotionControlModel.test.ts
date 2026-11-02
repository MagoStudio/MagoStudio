import {
  PrepareRenderSettingsContext,
  VideoEngine,
  VideoSettings
} from "@models/video/types";
import { describe, expect, it } from "vitest";

import { kling2_6MotionControlModel } from "./kling2_6MotionControlModel";

const baseContext: PrepareRenderSettingsContext = {
  inputVideoWidth: 1080,
  inputVideoHeight: 1920,
  frameRange: [0, 120],
  fps: 24,
  sources: []
};

const forBackend = (
  settings: VideoSettings,
  sources: PrepareRenderSettingsContext["sources"] = []
) =>
  kling2_6MotionControlModel.formatValuesForBackend!(settings, {
    ...baseContext,
    sources
  });

const forFrontend = (values: VideoSettings) =>
  kling2_6MotionControlModel.formatValuesForFrontend!(values);

describe("kling2_6MotionControlModel", () => {
  it("uses the kling_2_6_motion_control engine name", () => {
    expect(kling2_6MotionControlModel.name).toBe(
      VideoEngine.kling_2_6_motion_control
    );
  });

  describe("formatValuesForBackend", () => {
    it("derives image_id from the motion_reference source (uploader writes motion_reference)", () => {
      const out = forBackend({} as VideoSettings, [
        { asset_id: "char-uuid", type: "motion_reference" }
      ]);
      expect(out.image_id).toBe("char-uuid");
    });

    it("leaves image_id undefined when sources is empty", () => {
      const out = forBackend({} as VideoSettings, []);
      expect(out.image_id).toBeUndefined();
    });

    it("sets fixed character_orientation and keep_original_sound", () => {
      const out = forBackend({} as VideoSettings);
      expect(out.character_orientation).toBe("video");
      expect(out.keep_original_sound).toBe(true);
    });

    it("computes duration and frame range from context", () => {
      const out = forBackend({} as VideoSettings);
      expect(out.durationInSeconds).toBe(121 / 24);
      expect(out.frameRangeSeconds).toEqual([0, 5]);
      expect(out.offsetInSeconds).toBe(0);
      expect(out.fps).toBe(24);
      expect(out.width).toBe(1080);
      expect(out.height).toBe(1920);
    });
  });

  describe("formatValuesForFrontend", () => {
    it("strips the BE-only image_id and adds nothing in its place (no legacy scalar source key)", () => {
      const out = forFrontend({ image_id: "char-uuid" } as VideoSettings);
      expect(out).toEqual({});
    });

    it("preserves unrelated keys while stripping image_id", () => {
      const out = forFrontend({
        fps: 30,
        image_id: "char-uuid"
      } as VideoSettings);
      expect(out).toEqual({ fps: 30 });
    });
  });
});
