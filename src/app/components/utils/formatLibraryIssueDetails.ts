import type { LibraryIssue } from "../../../../desktop/shared/contracts";

export const formatLibraryIssueDetails = (
  appVersion: string,
  issues: LibraryIssue[]
): string =>
  [
    `Mago Studio ${appVersion}`,
    ...issues.map((issue) => `${issue.kind} · ${issue.id} · ${issue.message}`)
  ].join("\n");
