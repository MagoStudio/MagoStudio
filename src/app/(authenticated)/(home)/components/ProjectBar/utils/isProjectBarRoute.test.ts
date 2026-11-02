import { describe, expect, it } from "vitest";

import { isProjectBarRoute } from "./isProjectBarRoute";

describe("isProjectBarRoute", () => {
  it.each(["/project/", "/project-timeline/", "/script-project/"])(
    "shows the project bar on %s",
    (pathname) => {
      expect(isProjectBarRoute(pathname)).toBe(true);
    }
  );

  it.each(["/", "/projects/", "/payment/", "/plan/", "/pricing/"])(
    "hides the project bar on %s",
    (pathname) => {
      expect(isProjectBarRoute(pathname)).toBe(false);
    }
  );
});
