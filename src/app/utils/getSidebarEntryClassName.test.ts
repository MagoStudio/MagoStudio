import { describe, expect, it } from "vitest";

import { getSidebarEntryClassName } from "./getSidebarEntryClassName";

describe("getSidebarEntryClassName", () => {
  it("marks an active entry with the active background", () => {
    expect(getSidebarEntryClassName({ isEntryActive: true })).toContain(
      "bg-element-primary-active"
    );
  });

  it("gives an idle entry a hover state only", () => {
    const idleClassName = getSidebarEntryClassName({ isEntryActive: false });

    expect(idleClassName).toContain("hover:bg-element-primary-active");
    expect(idleClassName.split(" ")).not.toContain("bg-element-primary-active");
  });

  it("drops the hover state of a disabled entry", () => {
    const disabledClassName = getSidebarEntryClassName({
      isEntryActive: false,
      isEntryDisabled: true
    });

    expect(disabledClassName).toContain("cursor-not-allowed");
    expect(disabledClassName).not.toContain("hover:bg-element-primary-active");
  });
});
