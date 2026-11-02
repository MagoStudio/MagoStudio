import { BulkRendersRunStep } from "@schemas/bulkRendersRun";

const FAILED_STEP_STATUS = "FAILED";

/** Which Shots a plan has given up on.
 *
 * The steps queued behind a failed one stay `PENDING` for the rest of the run, so a plan can be
 * `RUNNING` while a Shot inside it is finished with. Nothing else records that: a branch that
 * dies before `create_render_layer` leaves neither a Render Track nor a version to read it off. */
export const collectFailedTimelineIds = (
  steps: BulkRendersRunStep[] | undefined
): Set<string> => {
  const timelineIds = new Set<string>();

  for (const step of steps ?? []) {
    if (!step.timeline_id) continue;
    if (step.status !== FAILED_STEP_STATUS) continue;
    timelineIds.add(step.timeline_id);
  }

  return timelineIds;
};
