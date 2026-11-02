import {
  PrepareRenderSettingsContext,
  ValidationContext,
  VideoSettings
} from "@models/video/types";
import { describe, it, expect } from "vitest";

import { kling3_0MotionControlModel } from "./kling3_0MotionControlModel";

const calc = (settings: VideoSettings, frames: number) =>
  kling3_0MotionControlModel.calcEstimatedRenderTime(settings, frames)
    .impactToShow;

const validate = (overrides: Partial<ValidationContext> = {}) =>
  kling3_0MotionControlModel.validateContext!({
    fps: 30,
    isUnlimitedModeActive: false,
    inputVideoWidth: 1080,
    inputVideoHeight: 1920,
    ...overrides
  });

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
  kling3_0MotionControlModel.formatValuesForBackend!(settings, {
    ...baseContext,
    sources
  });

const forFrontend = (values: VideoSettings) =>
  kling3_0MotionControlModel.formatValuesForFrontend!(values);

describe("kling3_0MotionControlModel", () => {
  describe("calcEstimatedRenderTime", () => {
    it("120 frames at 24fps = 5s → 1290 credits", () => {
      expect(calc({ fps: 24 } as VideoSettings, 120)).toBe(1290);
    });

    it("90 frames at 30fps = 3s → 774 credits", () => {
      expect(calc({ fps: 30 } as VideoSettings, 90)).toBe(774);
    });

    it("rounds up partial seconds", () => {
      expect(calc({ fps: 24 } as VideoSettings, 108)).toBe(
        Math.ceil((108 / 24) * 258)
      );
    });

    it("falls back to 24fps when fps is missing", () => {
      expect(calc({} as VideoSettings, 120)).toBe(1290);
    });
  });

  describe("validateContext", () => {
    it("accepts a valid context", () => {
      expect(validate()).toEqual({ isRenderContextValid: true });
    });

    it("rejects fps below 24", () => {
      const result = validate({ fps: 15 });
      expect(result.isRenderContextValid).toBe(false);
      expect(result.errorKey).toContain("24fps");
    });

    it("rejects fps above 60", () => {
      const result = validate({ fps: 120 });
      expect(result.isRenderContextValid).toBe(false);
      expect(result.errorKey).toContain("60fps");
    });

    it("rejects dimensions smaller than 340 on the shortest side", () => {
      const result = validate({
        inputVideoWidth: 200,
        inputVideoHeight: 1080
      });
      expect(result.isRenderContextValid).toBe(false);
      expect(result.errorKey).toContain("340");
    });

    it("rejects dimensions larger than 3850 on the longest side", () => {
      const result = validate({
        inputVideoWidth: 4000,
        inputVideoHeight: 1080
      });
      expect(result.isRenderContextValid).toBe(false);
      expect(result.errorKey).toContain("3850");
    });
  });

  describe("formatValuesForBackend", () => {
    it("derives image_id from the motion_reference source (uploader writes motion_reference)", () => {
      const out = forBackend({} as VideoSettings, [
        { asset_id: "char-uuid", type: "motion_reference" }
      ]);
      expect(out.image_id).toBe("char-uuid");
    });

    it("leaves image_id undefined when sources are empty", () => {
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

    it("omits the elements key entirely when both element images are empty", () => {
      const out = forBackend({} as VideoSettings);
      expect("elements" in out).toBe(false);
    });

    it("builds elements when both element entries are present in sources", () => {
      const out = forBackend({} as VideoSettings, [
        { asset_id: "ref-uuid", type: "element_reference", index: 0 },
        { asset_id: "frontal-uuid", type: "element_frontal", index: 0 }
      ]);
      expect(out.elements).toEqual([
        {
          reference_image_id: ["ref-uuid"],
          frontal_image_id: "frontal-uuid"
        }
      ]);
    });

    it("omits the elements key when only reference is filled (defense in depth — validation should block first)", () => {
      const out = forBackend({
        reference_image_id: "ref-uuid"
      } as VideoSettings);
      expect("elements" in out).toBe(false);
    });

    it("omits the elements key when only frontal is filled (defense in depth — validation should block first)", () => {
      const out = forBackend({
        frontal_image_id: "frontal-uuid"
      } as VideoSettings);
      expect("elements" in out).toBe(false);
    });

    it("strips the FE-only reference/frontal keys from the BE payload", () => {
      const out = forBackend({
        reference_image_id: "ref-uuid",
        frontal_image_id: "frontal-uuid"
      } as VideoSettings);
      expect(out.reference_image_id).toBeUndefined();
      expect(out.frontal_image_id).toBeUndefined();
    });
  });

  describe("formatValuesForFrontend", () => {
    it("strips image_id and adds nothing in its place (no legacy scalar source key)", () => {
      const out = forFrontend({ image_id: "char-uuid" } as VideoSettings);
      expect(out).toEqual({});
    });

    it("parses elements[0] back to reference and frontal", () => {
      const out = forFrontend({
        elements: [
          {
            reference_image_id: ["ref-uuid"],
            frontal_image_id: "frontal-uuid"
          }
        ]
      } as VideoSettings);
      expect(out.reference_image_id).toBe("ref-uuid");
      expect(out.frontal_image_id).toBe("frontal-uuid");
      expect(out.elements).toBeUndefined();
    });

    it("tolerates a legacy scalar reference_image_id in the BE payload", () => {
      const out = forFrontend({
        elements: [
          {
            reference_image_id: "ref-uuid",
            frontal_image_id: "frontal-uuid"
          }
        ]
      } as unknown as VideoSettings);
      expect(out.reference_image_id).toBe("ref-uuid");
      expect(out.frontal_image_id).toBe("frontal-uuid");
    });

    it("is a no-op when elements is an empty array", () => {
      const out = forFrontend({
        fps: 30,
        elements: [] as string[]
      } as VideoSettings);
      expect(out.reference_image_id).toBeUndefined();
      expect(out.frontal_image_id).toBeUndefined();
      expect(out.fps).toBe(30);
    });

    it("is a no-op for elements when absent", () => {
      const out = forFrontend({ fps: 30 } as VideoSettings);
      expect(out.reference_image_id).toBeUndefined();
      expect(out.frontal_image_id).toBeUndefined();
      expect(out.elements).toBeUndefined();
      expect(out.fps).toBe(30);
    });
  });

  describe("settings schema", () => {
    const settings =
      kling3_0MotionControlModel.settingsGroups[0].sections[0].settings;

    it("element uploader rejects partial state from sources (only element_reference set)", () => {
      const element = settings.find((s) => s.key === "reference_image_id");
      const result = element?.customValidation?.(
        "anything",
        {} as VideoSettings,
        [{ asset_id: "ref-uuid", type: "element_reference", index: 0 }]
      );
      expect(result).not.toBeNull();
    });

    it("element uploader rejects partial state from sources (only element_frontal set)", () => {
      const element = settings.find((s) => s.key === "reference_image_id");
      const result = element?.customValidation?.(
        "anything",
        {} as VideoSettings,
        [{ asset_id: "frontal-uuid", type: "element_frontal", index: 0 }]
      );
      expect(result).not.toBeNull();
    });

    it("element uploader accepts both empty (no element sources)", () => {
      const element = settings.find((s) => s.key === "reference_image_id");
      const result = element?.customValidation?.(
        "anything",
        {} as VideoSettings,
        []
      );
      expect(result).toBeNull();
    });

    it("element uploader accepts both filled from sources, ignoring stray legacy allValues", () => {
      const element = settings.find((s) => s.key === "reference_image_id");
      const result = element?.customValidation?.(
        "anything",
        { reference_image_id: "stale-ref" } as VideoSettings,
        [
          { asset_id: "ref-uuid", type: "element_reference", index: 0 },
          { asset_id: "frontal-uuid", type: "element_frontal", index: 0 }
        ]
      );
      expect(result).toBeNull();
    });
  });
});
