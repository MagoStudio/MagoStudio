import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { z } from "zod";

const SHEET_BATCH_SUBMIT_TOOL_NAME = "submit_img2img_batch";
const SHEET_BATCH_POLL_TOOL_NAME = "poll_img2img_batch";

const UNFINISHED_STEP_STATUSES = new Set(["PENDING", "RUNNING"]);

/** Only the fields we read. The submit step's own result is the one place a sheet run says
 * which entity it is rendering — every step in the batch carries the sheets timeline id, so
 * the step's `timeline_id` cannot tell one entity from another. */
const SheetBatchSubmitResultSchema = z.object({
  token: z.string().nullable().default(null),
  jobs: z
    .array(z.object({ key: z.string().nullable().default(null) }))
    .default([]),
  items: z
    .array(z.object({ key: z.string().nullable().default(null) }))
    .default([]),
  completed: z.record(z.string(), z.unknown()).default({})
});

/** The poll step reports the keys that landed. It resolves only once every job in its pass is
 * terminal, and the backend records a step's result on completion, so this arrives per pass
 * rather than per entity. */
const SheetBatchPollResultSchema = z.object({
  images: z.record(z.string(), z.unknown()).default({})
});

/** Which entity tokens a still-running sheet plan has work left for.
 *
 * A run is `submit → poll` unrolled once per re-drive. The submit step's `completed` record holds
 * the keys a PREVIOUS pass rendered, so it is empty on the first pass — reading only that made
 * the first submit step contribute every token and never give one back, leaving every entity
 * badged as rendering until the whole plan settled.
 *
 * The finished set is therefore accumulated across every step that reports one. It only grows: a
 * key that landed stays in each later pass's `completed`.
 *
 * A key the poll reports as `failed` is deliberately absent from that set — the next re-drive
 * submits exactly those keys, so it is still pending work. Once no pass remains, the run has no
 * unfinished step and the badge clears wholesale. */
export const collectInProgressSheetTokens = (
  steps: BulkRendersRunStep[] | undefined
): Set<string> => {
  const tokens = new Set<string>();

  const hasUnfinishedBatchStep = (steps ?? []).some((step) =>
    UNFINISHED_STEP_STATUSES.has(step.status)
  );
  if (!hasUnfinishedBatchStep) return tokens;

  const plannedKeys = new Set<string>();
  const finishedKeys = new Set<string>();

  for (const step of steps ?? []) {
    if (step.tool_name === SHEET_BATCH_SUBMIT_TOOL_NAME) {
      const parsed = SheetBatchSubmitResultSchema.safeParse(step.result);
      if (!parsed.success) continue;

      if (parsed.data.token) plannedKeys.add(parsed.data.token);
      for (const entry of [...parsed.data.jobs, ...parsed.data.items]) {
        if (entry.key) plannedKeys.add(entry.key);
      }
      for (const key of Object.keys(parsed.data.completed)) {
        finishedKeys.add(key);
      }
      continue;
    }

    if (step.tool_name === SHEET_BATCH_POLL_TOOL_NAME) {
      const parsed = SheetBatchPollResultSchema.safeParse(step.result);
      if (!parsed.success) continue;

      for (const key of Object.keys(parsed.data.images)) {
        finishedKeys.add(key);
      }
    }
  }

  for (const key of plannedKeys) {
    if (finishedKeys.has(key)) continue;
    tokens.add(key);
  }

  return tokens;
};
