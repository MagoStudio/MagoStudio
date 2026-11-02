import { describe, expect, it } from "vitest";

import { ONBOARDING_PROMPT_INPUT_SLOT } from "../constants";

import { buildOnboardingVideoPrompt } from "./buildOnboardingVideoPrompt";

describe("buildOnboardingVideoPrompt", () => {
  const expected = (input: string) => `@video1 = source video
Do not change:
Camera movement and path
Composition and framing
Lighting direction and intensity
Scene structure and depth

TRANSFORM:
"${input}"

NEGATIVE:
Do not alter camera angle, do not add new camera moves,
do not change composition, do not relight the scene,
no added motion blur, no flickering, no distorted faces`;

  it("injects the user's input, quoted, into the TRANSFORM slot", () => {
    expect(buildOnboardingVideoPrompt("make it snowy")).toBe(
      expected("make it snowy")
    );
  });

  it("trims surrounding whitespace before quoting", () => {
    expect(buildOnboardingVideoPrompt("  make it snowy \n")).toBe(
      expected("make it snowy")
    );
  });

  it("locks the empty-quotes contract for empty / whitespace-only input", () => {
    expect(buildOnboardingVideoPrompt("")).toBe(expected(""));
    expect(buildOnboardingVideoPrompt("   \n  ")).toBe(expected(""));
  });

  it("preserves interior newlines in multi-line input (only outer whitespace trimmed)", () => {
    expect(buildOnboardingVideoPrompt("  make it snowy\nand windy  ")).toBe(
      expected("make it snowy\nand windy")
    );
  });

  it("inserts `$` replacement sequences literally, not as replace patterns", () => {
    expect(buildOnboardingVideoPrompt("make it cost $& and $' more")).toBe(
      expected("make it cost $& and $' more")
    );
  });

  it("wraps the input in double-quotes inside the TRANSFORM section", () => {
    expect(buildOnboardingVideoPrompt("a city at night")).toContain(
      'TRANSFORM:\n"a city at night"\n'
    );
  });

  it("leaves no unresolved placeholder token", () => {
    expect(buildOnboardingVideoPrompt("anything")).not.toContain(
      ONBOARDING_PROMPT_INPUT_SLOT
    );
  });

  it("keeps the 'Do not change' block before TRANSFORM and NEGATIVE after it", () => {
    const result = buildOnboardingVideoPrompt("x");
    const doNotChangeIndex = result.indexOf("Do not change:");
    const transformIndex = result.indexOf("TRANSFORM:");
    const negativeIndex = result.indexOf("NEGATIVE:");
    expect(doNotChangeIndex).toBeGreaterThanOrEqual(0);
    expect(doNotChangeIndex).toBeLessThan(transformIndex);
    expect(transformIndex).toBeLessThan(negativeIndex);
  });

  it("does not add any @Image tag when there are no reference images", () => {
    expect(buildOnboardingVideoPrompt("make it snowy")).toBe(
      expected("make it snowy")
    );
    expect(
      buildOnboardingVideoPrompt("make it snowy").toLowerCase()
    ).not.toContain("@image");
  });

  it("appends the model-required @Image1 tag when a reference image is selected", () => {
    const result = buildOnboardingVideoPrompt("make it snowy", ["asset-123"]);

    expect(result).toContain("@Image1");
    expect(result.trim().endsWith("@Image1")).toBe(true);
  });

  it("appends one @Image tag per filled image slot, in order", () => {
    const result = buildOnboardingVideoPrompt("make it snowy", [
      "asset-1",
      "asset-2"
    ]);

    expect(result).toContain("@Image1");
    expect(result).toContain("@Image2");
  });

  it("does not duplicate an @Image tag that is already present", () => {
    const result = buildOnboardingVideoPrompt("make it @Image1 style", [
      "asset-1"
    ]);
    const occurrences = result.match(/@image1/gi) ?? [];

    expect(occurrences).toHaveLength(1);
  });
});
