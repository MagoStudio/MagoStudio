import { describe, expect, it } from "vitest";

import { qwenAdapter } from "../adapters/qwen.adapter";

import { QwenSchema } from "./qwen.schema";

const baseInput = {
  model: "qwen" as const,
  frameType: "video" as const,
  referenceImages: [],
  prompt: "restyle the image",
  generationCost: 0
};

describe("local Qwen Image Edit setup", () => {
  it("uses the GGUF Q5 four-step workflow by default", () => {
    const parsed = QwenSchema.parse(baseInput);
    expect(parsed.qwen_image_edit_setup).toBe("gguf-q5-4step");
  });

  it("passes the selected GGUF four-step setup into render settings", () => {
    const parsed = QwenSchema.parse({
      ...baseInput,
      qwen_image_edit_setup: "gguf-q5-4step"
    });

    expect(qwenAdapter.buildSettings(parsed)).toEqual({
      qwen_image_edit_setup: "gguf-q5-4step"
    });
  });

  it.each(["flux2-klein-4b-q8", "flux2-klein-9b-q8"] as const)(
    "passes the selected %s Flux engine into render settings",
    (setup) => {
      const parsed = QwenSchema.parse({
        ...baseInput,
        qwen_image_edit_setup: setup
      });

      expect(qwenAdapter.buildSettings(parsed)).toEqual({
        qwen_image_edit_setup: setup
      });
    }
  );
});
