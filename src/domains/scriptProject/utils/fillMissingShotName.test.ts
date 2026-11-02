import { describe, expect, it } from "vitest";

import { fillMissingShotName } from "./fillMissingShotName";

describe("fillMissingShotName", () => {
  it("keeps a heading that has a name", () => {
    expect(fillMissingShotName(" 1.2 Door close-up ", "New scene")).toBe(
      "1.2 Door close-up"
    );
    expect(fillMissingShotName("Opening", "New scene")).toBe("Opening");
  });

  it("names a heading that is only a number", () => {
    expect(fillMissingShotName("1.2 ", "New scene")).toBe("1.2 New scene");
  });

  it("uses the default name for an empty heading", () => {
    expect(fillMissingShotName("  ", "New scene")).toBe("New scene");
  });
});
