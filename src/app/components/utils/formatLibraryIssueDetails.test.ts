import { expect, it } from "vitest";

import { formatLibraryIssueDetails } from "./formatLibraryIssueDetails";

it("lists the app version, then one line per issue", () => {
  expect(
    formatLibraryIssueDetails("1.4.0", [
      { id: "database", kind: "database", message: "Library access paused" },
      { id: "render:job", kind: "asset", message: "Render failed" }
    ])
  ).toBe(
    [
      "Mago Studio 1.4.0",
      "database · database · Library access paused",
      "asset · render:job · Render failed"
    ].join("\n")
  );
});
