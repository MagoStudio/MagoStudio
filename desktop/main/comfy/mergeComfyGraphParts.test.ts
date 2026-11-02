import { describe, expect, it } from "vitest";

import { mergeComfyGraphParts } from "./mergeComfyGraphParts";

describe("mergeComfyGraphParts", () => {
  it("merges parts with distinct node ids", () => {
    expect(
      mergeComfyGraphParts([
        { "1": { class_type: "UNETLoader", inputs: {} } },
        { "2": { class_type: "VAELoader", inputs: {} } }
      ])
    ).toEqual({
      "1": { class_type: "UNETLoader", inputs: {} },
      "2": { class_type: "VAELoader", inputs: {} }
    });
  });

  it("refuses a node id used twice instead of silently replacing a node", () => {
    expect(() =>
      mergeComfyGraphParts([
        { "17": { class_type: "LoraLoaderModelOnly", inputs: {} } },
        { "17": { class_type: "MiniMaxH3AddGuide", inputs: {} } }
      ])
    ).toThrow("ComfyUI graph node id 17 is used twice");
  });
});
