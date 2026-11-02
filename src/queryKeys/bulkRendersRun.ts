export const bulkRendersRuns = {
  all: ["bulkRendersRuns"] as const,
  everyProject: () => [...bulkRendersRuns.all, "everyProject"] as const,
  byProjectId: (projectId: string | undefined) =>
    [...bulkRendersRuns.all, "project", projectId] as const
};

export const bulkRendersRunProgress = {
  all: ["bulkRendersRunProgress"] as const,
  byRunId: (bulkRunId: string | undefined) =>
    [...bulkRendersRunProgress.all, bulkRunId] as const
};

export const bulkRendersRunSteps = {
  all: ["bulkRendersRunSteps"] as const,
  byRunId: (bulkRunId: string | undefined) =>
    [...bulkRendersRunSteps.all, bulkRunId] as const,
  /** Carries whether the run was still active when the steps were read, so a run going terminal
   * changes the key and buys exactly one more fetch — the one that sees every step settled. The
   * two queries poll on drifting timers, so without it the last steps snapshot can predate the
   * final step transitions and the view freezes mid-progress. */
  byRunIdWhileActive: (bulkRunId: string | undefined, isRunActive: boolean) =>
    [...bulkRendersRunSteps.byRunId(bulkRunId), { isRunActive }] as const
};

export const bulkRendersRunDetail = {
  all: ["bulkRendersRunDetail"] as const,
  byRunId: (bulkRunId: string | undefined) =>
    [...bulkRendersRunDetail.all, bulkRunId] as const
};
