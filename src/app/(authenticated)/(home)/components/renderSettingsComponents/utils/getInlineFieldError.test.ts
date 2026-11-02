import { klingO1Model } from "@models/video/klingO1Model";
import { describe, expect, it } from "vitest";

import { getInlineFieldError } from "./getInlineFieldError";

describe("getInlineFieldError", () => {
  it("returns the required-field error when the prompt is empty", () => {
    expect(getInlineFieldError(klingO1Model, { prompt: "" }, "prompt")).toBe(
      "You need to add a prompt"
    );
  });

  it("returns the model's customValidation error for an unmatched @Image1 tag", () => {
    expect(
      getInlineFieldError(
        klingO1Model,
        { prompt: "match @Image1 style", image_ids: [] },
        "prompt"
      )
    ).toBe("Please add @Image1 or remove it from your prompt");
  });

  it("returns undefined when the field is valid", () => {
    expect(
      getInlineFieldError(
        klingO1Model,
        { prompt: "a valid prompt", image_ids: [] },
        "prompt"
      )
    ).toBeUndefined();
  });

  it("returns undefined for a field with no matching issue", () => {
    expect(
      getInlineFieldError(klingO1Model, { prompt: "valid" }, "image_ids")
    ).toBeUndefined();
  });
});
