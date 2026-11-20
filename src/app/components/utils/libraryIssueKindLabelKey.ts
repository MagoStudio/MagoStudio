import type { LibraryIssue } from "../../../../desktop/shared/contracts";

export const libraryIssueKindLabelKey = (
  issue: Pick<LibraryIssue, "kind">
): string => {
  if (issue.kind === "database") return "libraryHealth.kinds.database";
  if (issue.kind === "project") return "libraryHealth.kinds.projectData";
  if (issue.kind === "asset") return "libraryHealth.kinds.fileOrRender";
  return "libraryHealth.kinds.service";
};
