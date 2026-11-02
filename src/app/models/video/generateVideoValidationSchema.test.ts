import { describe, it, expect } from "vitest";

import { generateVideoValidationSchema } from "./generateVideoValidationSchema";
import { VideoModelDefinition, VideoEngine } from "./types";

describe("generateVideoValidationSchema", () => {
  const createMockModel = (
    overrides?: Partial<VideoModelDefinition>
  ): VideoModelDefinition => ({
    name: VideoEngine.V5_0_0,
    capabilities: {},
    displayName: "Test Model",
    description: "Test Description",
    type: "render",
    status: "active",
    modeAvailability: {
      isRelaxedModeAvailable: true
    },
    calcEstimatedRenderTime: () => ({ impactToShow: 0 }),
    renderDurationLimits: {
      defaultFrameRange: { defaultRender: 99, testRender: 48 },
      modelLimits: {
        minFrames: 8,
        maxFrames: 2000,
        interpolationMinFrames: 24,
        interpolationMaxFrames: 2000
      }
    },
    settingsGroups: [],
    ...overrides
  });

  describe("string fields", () => {
    it("should reject empty string when nullable is false", () => {
      const model = createMockModel({
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "prompt",
                    type: "string",
                    label: "Prompt",
                    ui: "Prompt",
                    nullable: false
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);

      expect(() => schema.parse({ prompt: "" })).toThrow();
      expect(() => schema.parse({ prompt: "hello" })).not.toThrow();
    });

    it("should allow empty string when nullable is true", () => {
      const model = createMockModel({
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "prompt",
                    type: "string",
                    label: "Prompt",
                    ui: "Prompt",
                    nullable: true
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);

      expect(() => schema.parse({ prompt: "" })).not.toThrow();
      expect(() => schema.parse({ prompt: null })).not.toThrow();
    });

    it("should use custom errorMessage when provided", () => {
      const model = createMockModel({
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "prompt",
                    type: "string",
                    label: "Prompt",
                    ui: "Prompt",
                    nullable: false,
                    errorMessage: "custom.error.message"
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);
      const result = schema.safeParse({ prompt: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("custom.error.message");
      }
    });
  });

  describe("number fields", () => {
    it("should validate min constraint", () => {
      const model = createMockModel({
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "steps",
                    type: "number",
                    label: "Steps",
                    ui: "NumberInput",
                    min: 1,
                    max: 100
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);

      expect(() => schema.parse({ steps: 0 })).toThrow();
      expect(() => schema.parse({ steps: 1 })).not.toThrow();
      expect(() => schema.parse({ steps: 50 })).not.toThrow();
    });

    it("should validate max constraint", () => {
      const model = createMockModel({
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "steps",
                    type: "number",
                    label: "Steps",
                    ui: "NumberInput",
                    min: 1,
                    max: 100
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);

      expect(() => schema.parse({ steps: 100 })).not.toThrow();
      expect(() => schema.parse({ steps: 101 })).toThrow();
    });

    it("should use custom errorMessage for min/max violations", () => {
      const model = createMockModel({
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "steps",
                    type: "number",
                    label: "Steps",
                    ui: "NumberInput",
                    min: 1,
                    max: 100,
                    errorMessage: "steps.out.of.range"
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);
      const result = schema.safeParse({ steps: 0 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("steps.out.of.range");
      }
    });
  });

  describe("customValidation", () => {
    it("should apply custom validation function", () => {
      const model = createMockModel({
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "custom_field",
                    type: "string",
                    label: "Custom",
                    ui: "TextInput",
                    customValidation: (value) =>
                      value === "valid" ? null : "custom.validation.error"
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);

      expect(() => schema.parse({ custom_field: "valid" })).not.toThrow();
      expect(() => schema.parse({ custom_field: "invalid" })).toThrow();
    });

    it("should reject empty string when nullable is false even with customValidation", () => {
      const model = createMockModel({
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "prompt",
                    type: "string",
                    label: "Prompt",
                    ui: "Prompt",
                    nullable: false,
                    errorMessage: "prompt.required",
                    customValidation: (value) => {
                      if (!value) return null;
                      return (value as string).includes("test")
                        ? null
                        : "custom.error";
                    }
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);

      expect(() => schema.parse({ prompt: "" })).toThrow();
      expect(() => schema.parse({ prompt: "test" })).not.toThrow();
      expect(() => schema.parse({ prompt: "invalid" })).toThrow();
    });

    it("should validate using allValues in customValidation", () => {
      const model = createMockModel({
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "field_a",
                    type: "string",
                    label: "Field A",
                    ui: "TextInput",
                    nullable: true
                  },
                  {
                    key: "field_b",
                    type: "string",
                    label: "Field B",
                    ui: "TextInput",
                    nullable: true,
                    customValidation: (_value, allValues) =>
                      allValues.field_a === "required_value"
                        ? null
                        : "field_a.must.be.required_value"
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);

      expect(() =>
        schema.parse({ field_a: "required_value", field_b: "any" })
      ).not.toThrow();
      expect(() =>
        schema.parse({ field_a: "other", field_b: "any" })
      ).toThrow();
    });
  });

  describe("isSourceImageRequired", () => {
    it("should make source_image_slot required when isSourceImageRequired is true", () => {
      const model = createMockModel({
        isSourceImageRequired: true,
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "source_image_slot",
                    type: "string",
                    label: "Image",
                    ui: "FileUploaderWithStylizeButton",
                    nullable: true
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);

      expect(() => schema.parse({ source_image_slot: undefined })).toThrow();
      expect(() => schema.parse({ source_image_slot: "" })).toThrow();
      expect(() =>
        schema.parse({ source_image_slot: "image-id" })
      ).not.toThrow();
    });

    it("should allow empty source_image_slot when isSourceImageRequired is false", () => {
      const model = createMockModel({
        isSourceImageRequired: false,
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "source_image_slot",
                    type: "string",
                    label: "Image",
                    ui: "FileUploaderWithStylizeButton",
                    nullable: true
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);

      expect(() =>
        schema.parse({ source_image_slot: undefined })
      ).not.toThrow();
      expect(() => schema.parse({ source_image_slot: null })).not.toThrow();
    });
  });

  describe("secondKey handling", () => {
    it("should create validation for both key and secondKey", () => {
      const model = createMockModel({
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "primary_key",
                    secondKey: "secondary_key",
                    type: "string",
                    label: "Test",
                    ui: "TextInput",
                    nullable: false
                  }
                ]
              }
            ]
          }
        ]
      });

      const schema = generateVideoValidationSchema(model);

      expect(() => schema.parse({ primary_key: "" })).toThrow();
      expect(() => schema.parse({ secondary_key: "" })).toThrow();
      expect(() => schema.parse({ primary_key: "value" })).not.toThrow();
      expect(() => schema.parse({ secondary_key: "value" })).not.toThrow();
    });
  });
});
