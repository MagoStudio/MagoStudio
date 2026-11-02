import { describe, expect, it } from "vitest";

import { formatShotTitle } from "./formatShotTitle";

describe("formatShotTitle", () => {
  it("shows the title without adding the position", () => {
    expect(
      formatShotTitle({ heading: " 1.1 Entering the house ", shotIndex: 4 })
    ).toBe("1.1 Entering the house");
  });

  it("falls back to the padded position for an untitled Shot", () => {
    expect(formatShotTitle({ heading: null, shotIndex: 2 })).toBe("03");
    expect(formatShotTitle({ heading: "  ", shotIndex: 11 })).toBe("12");
  });
});
