import { describe, expect, it } from "vitest";

import { resolveSidebarActiveProjectType } from "./resolveSidebarActiveProjectType";

describe("resolveSidebarActiveProjectType", () => {
  it("takes the type from a list page's search parameter", () => {
    expect(
      resolveSidebarActiveProjectType({
        pathname: "/projects/",
        projectTypeSearchParam: "script_to_shots"
      })
    ).toBe("script_to_shots");
  });

  it("treats a list page without a known type as Video to Video", () => {
    expect(
      resolveSidebarActiveProjectType({
        pathname: "/projects/",
        projectTypeSearchParam: null
      })
    ).toBe("timeline");
  });

  it.each([
    ["/project/", "timeline"],
    ["/project-timeline/", "timeline"],
    ["/script-project/", "script_to_shots"]
  ] as const)("marks %s as %s", (pathname, expectedProjectType) => {
    expect(
      resolveSidebarActiveProjectType({
        pathname,
        projectTypeSearchParam: null
      })
    ).toBe(expectedProjectType);
  });

  it.each(["/", "/payment/", "/plan/"])(
    "marks no project type on %s",
    (pathname) => {
      expect(
        resolveSidebarActiveProjectType({
          pathname,
          projectTypeSearchParam: null
        })
      ).toBeUndefined();
    }
  );
});
