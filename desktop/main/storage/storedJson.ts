import type { LibraryIssue } from "../../shared/contracts";
import { clearLibraryIssue, reportLibraryIssue } from "../libraryHealth";

export const storedObject = (
  value: string,
  issue: LibraryIssue,
  allowFallback = false
): Record<string, unknown> => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("Expected an object");
    clearLibraryIssue(issue.id);
    return parsed as Record<string, unknown>;
  } catch {
    reportLibraryIssue(issue);
    if (!allowFallback) throw new Error(issue.message);
    return {};
  }
};
