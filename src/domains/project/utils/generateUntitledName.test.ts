import { describe, expect, it } from "vitest";

import { generateUntitledName } from "./generateUntitledName";

describe("generateUntitledName", () => {
  it("returns bare prefix when no existing names", () => {
    expect(generateUntitledName([], "Untitled")).toBe("Untitled");
  });

  it("returns prefix_01 when bare prefix already exists", () => {
    expect(generateUntitledName(["Untitled"], "Untitled")).toBe("Untitled_01");
  });

  it("returns next number after existing", () => {
    expect(
      generateUntitledName(
        ["Untitled", "Untitled_01", "Untitled_02"],
        "Untitled"
      )
    ).toBe("Untitled_03");
  });

  it("handles gaps in numbering", () => {
    expect(
      generateUntitledName(
        ["Untitled", "Untitled_01", "Untitled_05"],
        "Untitled"
      )
    ).toBe("Untitled_06");
  });

  it("ignores names that do not match pattern", () => {
    expect(
      generateUntitledName(
        ["My Project", "Untitled_03", "Untitled", "Random"],
        "Untitled"
      )
    ).toBe("Untitled_04");
  });

  it("pads single-digit numbers with zero", () => {
    expect(generateUntitledName(["Untitled"], "Untitled")).toBe("Untitled_01");
  });

  it("handles double-digit numbers without extra padding", () => {
    const names = [
      "Untitled",
      ...Array.from(
        { length: 10 },
        (_, i) => `Untitled_${String(i + 1).padStart(2, "0")}`
      )
    ];
    expect(generateUntitledName(names, "Untitled")).toBe("Untitled_11");
  });
});
