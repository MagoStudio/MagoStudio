import { describe, expect, it } from "vitest";

import { resolveAppSidebarWidth } from "./resolveAppSidebarWidth";

describe("resolveAppSidebarWidth", () => {
  it("takes the sidebar token when expanded", () => {
    expect(
      resolveAppSidebarWidth({
        showsAppSidebar: true,
        isAppSidebarCollapsed: false
      })
    ).toBe("var(--width-app-sidebar)");
  });

  it("shrinks to a 48px strip when collapsed", () => {
    expect(
      resolveAppSidebarWidth({
        showsAppSidebar: true,
        isAppSidebarCollapsed: true
      })
    ).toBe("calc(var(--spacing) * 12)");
  });

  it("takes no width when the sidebar is not shown", () => {
    expect(
      resolveAppSidebarWidth({
        showsAppSidebar: false,
        isAppSidebarCollapsed: false
      })
    ).toBe("0px");
  });
});
