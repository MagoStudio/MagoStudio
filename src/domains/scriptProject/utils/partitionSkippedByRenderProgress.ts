import { SKIP_REASON_RENDER_IN_PROGRESS } from "../constants";

/** Split a dry run's `skipped` list into the two things the backend means by it.
 *
 * `already rendered with these inputs` is a finished version nobody needs to pay for again.
 * `render already in progress` is a live plan rendering that exact spec — a wait, not a
 * refusal. Counting both as "unchanged" told the user nothing was happening while their
 * render was running. */
export const partitionSkippedByRenderProgress = <T extends { reason: string }>(
  skipped: T[]
): {
  skippedAsUnchangedEntries: T[];
  skippedAsRenderInProgressEntries: T[];
} => ({
  skippedAsUnchangedEntries: skipped.filter(
    (entry) => entry.reason !== SKIP_REASON_RENDER_IN_PROGRESS
  ),
  skippedAsRenderInProgressEntries: skipped.filter(
    (entry) => entry.reason === SKIP_REASON_RENDER_IN_PROGRESS
  )
});
