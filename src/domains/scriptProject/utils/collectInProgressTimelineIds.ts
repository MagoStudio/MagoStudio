import { BulkRendersRunStep } from "@schemas/bulkRendersRun";

import { collectFailedTimelineIds } from "./collectFailedTimelineIds";

const UNFINISHED_STEP_STATUSES = new Set(["PENDING", "RUNNING"]);

/** Which shot timelines a still-running plan has work left for.
 *
 * A shot has no version row until `create_render_layer` runs, so the several minutes of
 * reference stitching and prompt adaptation before it looked, from the Shots tab, exactly like
 * a shot nobody had asked to render. The plan's own steps are the only thing that knows.
 *
 * A branch that already failed is left out. Its remaining steps stay `PENDING` for the rest of
 * the run, so counting them read as "rendering" for 2h09m on the 54-shot run of 2026-09-08 —
 * and that reading is what disabled the controls the user needed to recover the Shot. */
export const collectInProgressTimelineIds = (
  steps: BulkRendersRunStep[] | undefined
): Set<string> => {
  const failedTimelineIds = collectFailedTimelineIds(steps);
  const timelineIds = new Set<string>();

  for (const step of steps ?? []) {
    if (!step.timeline_id) continue;
    if (failedTimelineIds.has(step.timeline_id)) continue;
    if (!UNFINISHED_STEP_STATUSES.has(step.status)) continue;
    timelineIds.add(step.timeline_id);
  }

  return timelineIds;
};
