import { describe, expect, it } from "vitest";

import { suggestShotHeading } from "./suggestShotHeading";

describe("suggestShotHeading", () => {
  const shots = [
    { heading: "1 Opening", shot_index: 0 },
    { heading: "1.1 Insert", shot_index: 1 },
    { heading: "2 Ending", shot_index: 2 }
  ];

  it("suggests nothing when no number fits between its neighbours", () => {
    expect(suggestShotHeading(shots, 1)).toBe("");
  });

  it("increments a preceding inserted number while it still sorts before the next Shot", () => {
    expect(suggestShotHeading(shots, 2)).toBe("1.2 ");
  });

  it("goes one level deeper when the next number is taken by the following Shot", () => {
    expect(
      suggestShotHeading(
        [
          { heading: "1.1 Insert", shot_index: 0 },
          { heading: "1.2 Close-up", shot_index: 1 }
        ],
        1
      )
    ).toBe("1.1.1 ");
  });

  it("skips a number used elsewhere in the strip", () => {
    expect(
      suggestShotHeading(
        [
          { heading: "1 Opening", shot_index: 0 },
          { heading: "2 Ending", shot_index: 1 },
          { heading: "1.1 Moved", shot_index: 2 }
        ],
        1
      )
    ).toBe("1.2 ");
  });

  it("uses the final title when appending", () => {
    expect(suggestShotHeading(shots, null)).toBe("2.1 ");
  });

  it("handles the start of the list and an empty list", () => {
    expect(suggestShotHeading(shots, 0)).toBe("0.1 ");
    expect(suggestShotHeading([], null)).toBe("1 ");
  });

  it("does not reuse a number already taken at the start of the list", () => {
    expect(
      suggestShotHeading(
        [
          { heading: "0.1 Prologue", shot_index: 0 },
          { heading: "1 Opening", shot_index: 1 }
        ],
        0
      )
    ).toBe("");
  });

  it("falls back to the next whole number after unnumbered titles", () => {
    expect(
      suggestShotHeading(
        [
          { heading: "Opening", shot_index: 0 },
          { heading: "Middle", shot_index: 1 },
          { heading: "Ending", shot_index: 2 }
        ],
        null
      )
    ).toBe("4 ");
  });
});
