import { describe, expect, it } from "vitest";

import { parseShotHeadingNumber } from "./parseShotHeadingNumber";

describe("parseShotHeadingNumber", () => {
  it("reads a whole or dotted leading number", () => {
    expect(parseShotHeadingNumber("2 Ending")).toBe("2");
    expect(parseShotHeadingNumber("1.1 Insert")).toBe("1.1");
    expect(parseShotHeadingNumber("1.2")).toBe("1.2");
  });

  it("returns nothing for an unnumbered or missing heading", () => {
    expect(parseShotHeadingNumber("EXT. RUINED COLONY")).toBeUndefined();
    expect(parseShotHeadingNumber("2nd take")).toBeUndefined();
    expect(parseShotHeadingNumber(null)).toBeUndefined();
  });
});
