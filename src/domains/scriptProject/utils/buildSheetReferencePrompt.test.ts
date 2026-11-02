import { describe, expect, it } from "vitest";

import { buildSheetReferencePrompt } from "./buildSheetReferencePrompt";

describe("buildSheetReferencePrompt", () => {
  it("appends the instruction the way the backend words it", () => {
    expect(
      buildSheetReferencePrompt({
        prompt: "Hero portrait",
        referenceInstruction: " Use the face "
      })
    ).toBe(
      "Hero portrait\n\nUse the supplied reference images as follows: Use the face"
    );
  });

  it.each([undefined, null, "", "   "])(
    "adds nothing for the empty instruction %j",
    (referenceInstruction) => {
      expect(
        buildSheetReferencePrompt({
          prompt: "Hero portrait",
          referenceInstruction
        })
      ).toBe("Hero portrait");
    }
  );
});
