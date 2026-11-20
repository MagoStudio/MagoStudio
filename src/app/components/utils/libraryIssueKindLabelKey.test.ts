import { expect, it } from "vitest";

import { libraryIssueKindLabelKey } from "./libraryIssueKindLabelKey";

it.each([
  ["database", "libraryHealth.kinds.database"],
  ["project", "libraryHealth.kinds.projectData"],
  ["asset", "libraryHealth.kinds.fileOrRender"],
  ["service", "libraryHealth.kinds.service"]
] as const)("labels a %s issue by its kind", (kind, expectedKey) => {
  expect(libraryIssueKindLabelKey({ kind })).toBe(expectedKey);
});
