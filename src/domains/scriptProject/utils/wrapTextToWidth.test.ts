import { describe, expect, it } from "vitest";

import { wrapTextToWidth } from "./wrapTextToWidth";

describe("wrapTextToWidth", () => {
  it("keeps text that fits on one line", () => {
    expect(wrapTextToWidth("We're close.", 35)).toEqual(["We're close."]);
  });

  it("breaks between words so no line exceeds the width", () => {
    expect(wrapTextToWidth("one two three four", 9)).toEqual([
      "one two",
      "three",
      "four"
    ]);
  });

  it("allows a line of exactly the width", () => {
    expect(wrapTextToWidth("abc def", 7)).toEqual(["abc def"]);
  });

  it("starts a new paragraph at each newline", () => {
    expect(wrapTextToWidth("First.\nSecond.", 35)).toEqual([
      "First.",
      "Second."
    ]);
  });

  it("drops blank paragraphs instead of emitting empty lines", () => {
    expect(wrapTextToWidth("Wait.\n\n  \nNo.", 35)).toEqual(["Wait.", "No."]);
  });

  it("breaks a word longer than the width", () => {
    expect(wrapTextToWidth("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
  });

  it("collapses runs of whitespace and trims the ends", () => {
    expect(wrapTextToWidth("  one   two  ", 35)).toEqual(["one two"]);
  });
});
