import type { LibraryIssue } from "../shared/contracts";

const MAX_ISSUES = 200;
const issues = new Map<string, LibraryIssue>();
export const reportLibraryIssue = (issue: LibraryIssue): void => {
  if (issues.get(issue.id)?.message !== issue.message)
    console.error("Library issue", issue);
  issues.set(issue.id, issue);
  if (issues.size > MAX_ISSUES) issues.delete(issues.keys().next().value!);
};
export const clearLibraryIssue = (id: string): void => {
  issues.delete(id);
};
export const clearLibraryIssues = (): void => {
  issues.clear();
};
export const listLibraryIssues = (): LibraryIssue[] => [...issues.values()];

export const runBackgroundTask = async (
  id: string,
  task: () => Promise<void>
): Promise<void> => {
  try {
    await task();
    clearLibraryIssue(id);
  } catch (error) {
    reportLibraryIssue({
      id,
      kind: "service",
      message: `${id}: ${error instanceof Error ? error.message : String(error)}`
    });
  }
};
