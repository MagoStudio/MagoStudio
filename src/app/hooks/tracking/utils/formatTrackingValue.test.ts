import { describe, expect, it } from "vitest";

import { formatTrackingValue } from "./formatTrackingValue";

describe("formatTrackingValue", () => {
  it("passes strings through unchanged", () => {
    expect(formatTrackingValue("prompt_and_visual_selection")).toBe(
      "prompt_and_visual_selection"
    );
  });

  it("stringifies numbers the same way as toString", () => {
    expect(formatTrackingValue(30)).toBe("30");
  });

  it("stringifies booleans the same way as toString", () => {
    expect(formatTrackingValue(true)).toBe("true");
    expect(formatTrackingValue(false)).toBe("false");
  });

  it("returns undefined for undefined", () => {
    expect(formatTrackingValue(undefined)).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(formatTrackingValue(null)).toBeUndefined();
  });

  it("JSON-stringifies objects", () => {
    expect(formatTrackingValue({ max_size: 1024 })).toBe('{"max_size":1024}');
  });

  it("JSON-stringifies arrays", () => {
    expect(formatTrackingValue([1, 2, 3])).toBe("[1,2,3]");
  });

  it("JSON-stringifies lora settings instead of [object Object]", () => {
    expect(
      formatTrackingValue([{ lora_name: "style_v1", lora_strength: 0.8 }])
    ).toBe('[{"lora_name":"style_v1","lora_strength":0.8}]');
  });
});
