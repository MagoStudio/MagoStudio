import { describe, expect, it } from "vitest";

import { formatCutTimecode } from "./formatCutTimecode";

describe("formatCutTimecode", () => {
  it("pads the seconds so the ruler's labels line up", () => {
    expect(formatCutTimecode(0)).toBe("0:00");
    expect(formatCutTimecode(72)).toBe("0:03");
  });

  it("rolls into minutes", () => {
    expect(formatCutTimecode(24 * 65)).toBe("1:05");
  });

  it("reads a negative frame as the start of the cut", () => {
    expect(formatCutTimecode(-10)).toBe("0:00");
  });
});
