import { describe, expect, it } from "vitest";

import { readSheetImageSetting } from "./readSheetImageSetting";

describe("readSheetImageSetting", () => {
  it("reads a string setting", () => {
    expect(readSheetImageSetting({ prompt: "a marine" }, "prompt")).toBe(
      "a marine"
    );
  });

  it("renders a number setting as text, so a size never prints as an object", () => {
    expect(readSheetImageSetting({ width: 1920 }, "width")).toBe("1920");
  });

  it("is null for a blank string", () => {
    expect(readSheetImageSetting({ prompt: "   " }, "prompt")).toBeNull();
  });

  it("is null for a value the panel cannot print, rather than [object Object]", () => {
    expect(readSheetImageSetting({ crop: { top: 1 } }, "crop")).toBeNull();
    expect(readSheetImageSetting({ sizes: [1, 2] }, "sizes")).toBeNull();
  });

  it("is null when there are no settings at all", () => {
    expect(readSheetImageSetting(null, "prompt")).toBeNull();
    expect(readSheetImageSetting(undefined, "prompt")).toBeNull();
  });
});
