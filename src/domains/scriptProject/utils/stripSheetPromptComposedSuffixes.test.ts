import { describe, expect, it } from "vitest";

import { buildSheetReferencePrompt } from "./buildSheetReferencePrompt";
import {
  stripSheetPromptComposedSuffixes,
  VISUAL_STYLE_INSTRUCTION_PREFIX
} from "./stripSheetPromptComposedSuffixes";

const withReferenceInstruction = (prompt: string) =>
  buildSheetReferencePrompt({ prompt, referenceInstruction: "match the face" });

describe("stripSheetPromptComposedSuffixes", () => {
  it("returns a plain prompt unchanged", () => {
    expect(stripSheetPromptComposedSuffixes("a rugged sergeant")).toBe(
      "a rugged sergeant"
    );
  });

  it("removes the reference instruction the render appended", () => {
    expect(
      stripSheetPromptComposedSuffixes(
        withReferenceInstruction("a rugged sergeant")
      )
    ).toBe("a rugged sergeant");
  });

  it("removes the project visual style the backend appended", () => {
    expect(
      stripSheetPromptComposedSuffixes(
        `a rugged sergeant\n\n${VISUAL_STYLE_INSTRUCTION_PREFIX}grainy 16mm`
      )
    ).toBe("a rugged sergeant");
  });

  it("removes both suffixes when a render carried both", () => {
    expect(
      stripSheetPromptComposedSuffixes(
        `${withReferenceInstruction("a rugged sergeant")}\n\n${VISUAL_STYLE_INSTRUCTION_PREFIX}grainy 16mm`
      )
    ).toBe("a rugged sergeant");
  });
});
