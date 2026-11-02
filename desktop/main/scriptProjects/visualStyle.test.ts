import { describe, expect, it } from "vitest";

import { fingerprint } from "./renderSpec";
import { sheetSpec } from "./sheets/planSheetRun";
import {
  applyVisualStyle,
  castVisualStyleSeed,
  readProjectVisualStyle,
  visualStyleError
} from "./visualStyle";

const STYLE = "Cobalt risograph ink, copper halftones, violet paper grain 731.";

describe("visualStyleError", () => {
  it.each([
    [STYLE, null],
    ["", null],
    [null, null],
    [123, "settings.visual_style must be a string or null"],
    [{}, "settings.visual_style must be a string or null"],
    ["x".repeat(8001), "settings.visual_style must be at most 8000 characters"]
  ])("validates %j", (value, expected) => {
    expect(visualStyleError(value)).toBe(expected);
  });
});

describe("applyVisualStyle", () => {
  it("appends the backend's treatment instruction once", () => {
    const styled = applyVisualStyle("Rifle prompt", ` ${STYLE} `);
    expect(styled).toBe(
      "Rifle prompt\n\nApply only this visual treatment (medium, palette, texture, contrast, grain, and lighting treatment). Do not add or change any subject, character, object, setting, background, composition, or action based on this text: " +
        STYLE
    );
    expect(applyVisualStyle(styled, STYLE)).toBe(styled);
  });

  it.each(["", "   ", null, undefined])(
    "leaves the prompt alone for a blank style (%j)",
    (style) => {
      expect(applyVisualStyle("Rifle prompt", style)).toBe("Rifle prompt");
    }
  );
});

describe("castVisualStyleSeed", () => {
  it("seeds a project that never had a style", () => {
    expect(castVisualStyleSeed({}, STYLE)).toBe(STYLE);
  });

  it.each([null, "", "User-edited ink style"])(
    "keeps an explicit user style (%j)",
    (existing) => {
      expect(castVisualStyleSeed({ visual_style: existing }, STYLE)).toBeNull();
    }
  );

  it("does not seed a whitespace style, so a later cast still can", () => {
    expect(castVisualStyleSeed({}, "   ")).toBeNull();
    expect(castVisualStyleSeed({}, STYLE)).toBe(STYLE);
  });

  it("reads the trimmed setting, empty when unset", () => {
    expect(readProjectVisualStyle({ visual_style: ` ${STYLE} ` })).toBe(STYLE);
    expect(readProjectVisualStyle({ visual_style: null })).toBe("");
    expect(readProjectVisualStyle(undefined)).toBe("");
  });
});

describe("visual style in fingerprints", () => {
  it("moves the sheet fingerprint, but an empty style keeps the legacy spec", () => {
    const key = { token: "rifle", prompt: "Rifle prompt" };
    const baseline = sheetSpec(
      key,
      "Rifle prompt",
      "seedream",
      [1024, 1024],
      {}
    );
    expect(
      sheetSpec(key, "Rifle prompt", "seedream", [1024, 1024], {
        visualStyle: ""
      })
    ).toEqual(baseline);
    const styled = sheetSpec(key, "Rifle prompt", "seedream", [1024, 1024], {
      visualStyle: STYLE
    });
    expect(fingerprint(styled)).not.toBe(fingerprint(baseline));
    expect(styled.prompt).toBe(applyVisualStyle("Rifle prompt", STYLE));
    expect(styled.visual_style).toBe(STYLE);
  });
});
