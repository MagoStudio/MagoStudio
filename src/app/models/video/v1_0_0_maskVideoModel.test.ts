import { describe, expect, it } from "vitest";

import { v1_0_0_maskRenderModel } from "./v1_0_0_maskVideoModel";

describe("v1_0_0_maskRenderModel", () => {
  describe("formatValuesForFrontend", () => {
    const format = v1_0_0_maskRenderModel.formatValuesForFrontend!;

    it("converts point-based settings to visual_selection mode", () => {
      const result = format({
        prompt_type: "point",
        positive_points: [{ x: 640, y: 360 }] as any,
        negative_points: [{ x: 320, y: 180 }] as any,
        width: 1280,
        height: 720,
        expand: 5,
        blur: 0
      });

      expect(result.mask_mode).toBe("visual_selection");
      expect(result.expand).toBe(5);
      expect(result.blur).toBe(0);
      expect(result).not.toHaveProperty("prompt_type");
      expect(result).not.toHaveProperty("positive_points");
      expect(result).not.toHaveProperty("negative_points");
      expect(result).not.toHaveProperty("width");
      expect(result).not.toHaveProperty("height");

      const points = JSON.parse(result.mask_visual_selection as string);
      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 0.5, y: 0.5, label: 1 });
      expect(points[1]).toEqual({ x: 0.25, y: 0.25, label: 0 });
    });

    it("converts text-based settings to prompt mode", () => {
      const result = format({
        prompt_type: "text",
        prompt: "person",
        expand: 0,
        blur: 10
      });

      expect(result.mask_mode).toBe("prompt");
      expect(result.prompt).toBe("person");
      expect(result.expand).toBe(0);
      expect(result.blur).toBe(10);
      expect(result).not.toHaveProperty("prompt_type");
    });

    it("handles missing width/height by defaulting to 1", () => {
      const result = format({
        prompt_type: "point",
        positive_points: [{ x: 0.5, y: 0.3 }] as any,
        negative_points: [] as any
      });

      const points = JSON.parse(result.mask_visual_selection as string);
      expect(points).toHaveLength(1);
      expect(points[0]).toEqual({ x: 0.5, y: 0.3, label: 1 });
    });

    it("handles missing points arrays", () => {
      const result = format({
        prompt_type: "point",
        width: 1280,
        height: 720
      });

      expect(result.mask_mode).toBe("visual_selection");
      const points = JSON.parse(result.mask_visual_selection as string);
      expect(points).toHaveLength(0);
    });

    it("handles settings without prompt_type as prompt mode", () => {
      const result = format({
        expand: 5
      });

      expect(result.mask_mode).toBe("prompt");
      expect(result).not.toHaveProperty("prompt_type");
    });

    it("converts text+point settings to prompt_and_visual_selection mode", () => {
      const result = format({
        prompt_type: "text+point",
        prompt: "person",
        positive_points: [{ x: 640, y: 360 }] as any,
        negative_points: [{ x: 320, y: 180 }] as any,
        width: 1280,
        height: 720,
        expand: 3,
        blur: 2
      });

      expect(result.mask_mode).toBe("prompt_and_visual_selection");
      expect(result.prompt).toBe("person");
      expect(result.expand).toBe(3);
      expect(result.blur).toBe(2);
      expect(result).not.toHaveProperty("prompt_type");
      expect(result).not.toHaveProperty("positive_points");
      expect(result).not.toHaveProperty("negative_points");
      expect(result).not.toHaveProperty("width");
      expect(result).not.toHaveProperty("height");

      const points = JSON.parse(result.mask_visual_selection as string);
      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 0.5, y: 0.5, label: 1 });
      expect(points[1]).toEqual({ x: 0.25, y: 0.25, label: 0 });
    });
  });

  describe("formatValuesForBackend", () => {
    const prepare = v1_0_0_maskRenderModel.formatValuesForBackend!;
    const context = {
      inputVideoWidth: 1280,
      inputVideoHeight: 720,
      frameRange: [0, 48] as [number, number],
      fps: 24,
      sources: []
    };

    it("converts visual_selection to point format with pixel coords", () => {
      const points = [
        { x: 0.5, y: 0.5, label: 1 },
        { x: 0.25, y: 0.25, label: 0 }
      ];

      const result = prepare(
        {
          mask_mode: "visual_selection",
          mask_visual_selection: JSON.stringify(points),
          expand: 5
        },
        context
      );

      expect(result.prompt_type).toBe("point");
      expect(result.positive_points).toEqual([{ x: 640, y: 360 }]);
      expect(result.negative_points).toEqual([{ x: 320, y: 180 }]);
      expect(result.frame_idx).toBe(0);
      expect(result).not.toHaveProperty("mask_mode");
      expect(result).not.toHaveProperty("mask_visual_selection");
      expect(result).not.toHaveProperty("mask_frame_idx");
      expect(result).not.toHaveProperty("prompt");
    });

    it("includes frame_idx from settings in visual_selection mode", () => {
      const points = [{ x: 0.5, y: 0.5, label: 1 }];

      const result = prepare(
        {
          mask_mode: "visual_selection",
          mask_visual_selection: JSON.stringify(points),
          mask_frame_idx: 42
        },
        context
      );

      expect(result.frame_idx).toBe(42);
      expect(result).not.toHaveProperty("mask_frame_idx");
    });

    it("converts prompt mode to text format", () => {
      const result = prepare(
        {
          mask_mode: "prompt",
          prompt: "person",
          expand: 0
        },
        context
      );

      expect(result.prompt_type).toBe("text");
      expect(result.prompt).toBe("person");
      expect(result).not.toHaveProperty("mask_mode");
      expect(result).not.toHaveProperty("mask_visual_selection");
      expect(result).not.toHaveProperty("positive_points");
      expect(result).not.toHaveProperty("negative_points");
      expect(result).not.toHaveProperty("frame_idx");
    });

    it("converts prompt_and_visual_selection to text+point format with prompt and pixel-coord points", () => {
      const points = [
        { x: 0.5, y: 0.5, label: 1 },
        { x: 0.25, y: 0.25, label: 0 }
      ];

      const result = prepare(
        {
          mask_mode: "prompt_and_visual_selection",
          prompt: "person",
          mask_visual_selection: JSON.stringify(points),
          expand: 3,
          blur: 2
        },
        context
      );

      expect(result.prompt_type).toBe("text+point");
      expect(result.prompt).toBe("person");
      expect(result.positive_points).toEqual([{ x: 640, y: 360 }]);
      expect(result.negative_points).toEqual([{ x: 320, y: 180 }]);
      expect(result.frame_idx).toBe(0);
      expect(result.expand).toBe(3);
      expect(result.blur).toBe(2);
      expect(result).not.toHaveProperty("mask_mode");
      expect(result).not.toHaveProperty("mask_points");
      expect(result).not.toHaveProperty("mask_visual_selection");
      expect(result).not.toHaveProperty("mask_frame_idx");
    });
  });

  describe("round-trip: formatValuesForBackend → formatValuesForFrontend", () => {
    const prepare = v1_0_0_maskRenderModel.formatValuesForBackend!;
    const format = v1_0_0_maskRenderModel.formatValuesForFrontend!;
    const context = {
      inputVideoWidth: 1280,
      inputVideoHeight: 720,
      frameRange: [0, 48] as [number, number],
      fps: 24,
      sources: []
    };

    it("round-trips visual selection points with a non-zero frame_idx", () => {
      const original = {
        mask_mode: "visual_selection",
        mask_visual_selection: JSON.stringify([{ x: 0.5, y: 0.5, label: 1 }]),
        mask_frame_idx: 42
      };

      const backend = (
        v1_0_0_maskRenderModel.formatValuesForBackend as NonNullable<
          typeof v1_0_0_maskRenderModel.formatValuesForBackend
        >
      )(original, context);
      expect(backend.frame_idx).toBe(42);

      const restored = (
        v1_0_0_maskRenderModel.formatValuesForFrontend as NonNullable<
          typeof v1_0_0_maskRenderModel.formatValuesForFrontend
        >
      )(backend);
      expect(restored.mask_frame_idx).toBe(42);
    });

    it("round-trips visual selection points", () => {
      const original = {
        mask_mode: "visual_selection",
        mask_visual_selection: JSON.stringify([
          { x: 0.5, y: 0.5, label: 1 },
          { x: 0.25, y: 0.75, label: 0 }
        ]),
        mask_frame_idx: 15,
        expand: 5
      };

      const backend = prepare(original, context);
      expect(backend.frame_idx).toBe(15);
      expect(backend).not.toHaveProperty("mask_frame_idx");

      const restored = format(backend);

      expect(restored.mask_mode).toBe("visual_selection");
      expect(restored.mask_frame_idx).toBe(15);
      const restoredPoints = JSON.parse(
        restored.mask_visual_selection as string
      );
      expect(restoredPoints).toHaveLength(2);
      expect(restoredPoints[0].x).toBeCloseTo(0.5);
      expect(restoredPoints[0].y).toBeCloseTo(0.5);
      expect(restoredPoints[0].label).toBe(1);
      expect(restoredPoints[1].x).toBeCloseTo(0.25);
      expect(restoredPoints[1].y).toBeCloseTo(0.75);
      expect(restoredPoints[1].label).toBe(0);
    });

    it("round-trips text prompt", () => {
      const original = {
        mask_mode: "prompt",
        prompt: "person",
        expand: 0
      };

      const backend = prepare(original, context);
      const restored = format(backend);

      expect(restored.mask_mode).toBe("prompt");
      expect(restored.prompt).toBe("person");
    });

    it("round-trips prompt_and_visual_selection with prompt and points", () => {
      const original = {
        mask_mode: "prompt_and_visual_selection",
        prompt: "person",
        mask_visual_selection: JSON.stringify([
          { x: 0.5, y: 0.5, label: 1 },
          { x: 0.25, y: 0.75, label: 0 }
        ]),
        expand: 4
      };

      const backend = prepare(original, context);
      expect(backend.prompt_type).toBe("text+point");

      const restored = format(backend);

      expect(restored.mask_mode).toBe("prompt_and_visual_selection");
      expect(restored.prompt).toBe("person");
      const restoredPoints = JSON.parse(
        restored.mask_visual_selection as string
      );
      expect(restoredPoints).toHaveLength(2);
      expect(restoredPoints[0].x).toBeCloseTo(0.5);
      expect(restoredPoints[0].y).toBeCloseTo(0.5);
      expect(restoredPoints[0].label).toBe(1);
      expect(restoredPoints[1].x).toBeCloseTo(0.25);
      expect(restoredPoints[1].y).toBeCloseTo(0.75);
      expect(restoredPoints[1].label).toBe(0);
    });
  });

  describe("customValidation in combined mode", () => {
    const getField = (key: string) =>
      v1_0_0_maskRenderModel.settingsGroups![0]!.sections[0]!.settings.find(
        (s) => s.key === key
      )!;

    const promptValidator = getField("prompt").customValidation!;
    const visualSelectionValidator = getField(
      "mask_visual_selection"
    ).customValidation!;

    it("prompt-only empty prompt returns add_prompt key", () => {
      expect(promptValidator("", { mask_mode: "prompt" })).toBe(
        "masking.generate_disabled_add_prompt.label"
      );
    });

    it("points-only empty points returns add_points key", () => {
      expect(
        visualSelectionValidator("", { mask_mode: "visual_selection" })
      ).toBe("masking.generate_disabled_add_points.label");
    });

    it("combined mode with empty prompt returns add_prompt_and_points key", () => {
      expect(
        promptValidator("", { mask_mode: "prompt_and_visual_selection" })
      ).toBe("masking.generate_disabled_add_prompt_and_points.label");
    });

    it("combined mode with empty points returns add_prompt_and_points key", () => {
      expect(
        visualSelectionValidator("[]", {
          mask_mode: "prompt_and_visual_selection"
        })
      ).toBe("masking.generate_disabled_add_prompt_and_points.label");
    });

    it("combined mode with both filled returns null from both validators", () => {
      expect(
        promptValidator("person", {
          mask_mode: "prompt_and_visual_selection"
        })
      ).toBeNull();
      expect(
        visualSelectionValidator(
          JSON.stringify([{ x: 0.5, y: 0.5, label: 1 }]),
          { mask_mode: "prompt_and_visual_selection" }
        )
      ).toBeNull();
    });
  });
});
