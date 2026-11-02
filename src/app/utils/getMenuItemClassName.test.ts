import { describe, expect, it } from "vitest";

import { getMenuItemClassName } from "./getMenuItemClassName";

describe("getMenuItemClassName", () => {
  it("gives an enabled item a hover state", () => {
    expect(getMenuItemClassName({ isItemDisabled: false })).toContain(
      "hover:bg-element-primary-active"
    );
  });

  it("greys out a disabled item and drops its hover state", () => {
    const disabledClassName = getMenuItemClassName({ isItemDisabled: true });

    expect(disabledClassName).toContain("text-glyph-disabled");
    expect(disabledClassName).not.toContain("hover:bg-element-primary-active");
  });
});
