import { BulkRendersRunStep } from "@schemas/bulkRendersRun";

import {
  IMAGE_CHAIN_TOOL_NAMES,
  VIDEO_CHAIN_TOOL_NAMES
} from "./bulkRendersRunToolChains";

type BulkRendersRunShotPhase =
  | "pending"
  | "image"
  | "video"
  | "completed"
  | "failed";

export type BulkRendersRunAggregatePhase = BulkRendersRunShotPhase;

export interface BulkRendersRunShotPhases {
  byShotId: Record<string, BulkRendersRunShotPhase>;
  aggregate: BulkRendersRunAggregatePhase;
}

const AGGREGATE_PHASE_PRECEDENCE: BulkRendersRunAggregatePhase[] = [
  "image",
  "video",
  "pending"
];

const CHAIN_PRECEDENCE_FOR_SHOT_PHASE: Array<{
  phase: "video" | "image";
  toolNames: Set<string>;
}> = [
  { phase: "video", toolNames: VIDEO_CHAIN_TOOL_NAMES },
  { phase: "image", toolNames: IMAGE_CHAIN_TOOL_NAMES }
];

/** A skipped step is one the plan decided never to run, so it never started. The backend writes
 * SKIPPED when the plan is created — a Shot supplying its own reference frame has its whole image
 * chain skipped up front — so counting it as started reported that Shot, and through the
 * aggregate's image-first precedence the whole run, as working on images while nothing was. */
const NOT_STARTED_STEP_STATUSES = new Set(["PENDING", "SKIPPED"]);

const hasStartedStepInChain = (
  steps: BulkRendersRunStep[],
  toolNames: Set<string>
): boolean =>
  steps.some(
    (step) =>
      toolNames.has(step.tool_name) &&
      !NOT_STARTED_STEP_STATUSES.has(step.status)
  );

const deriveShotPhase = (
  shotSteps: BulkRendersRunStep[]
): BulkRendersRunShotPhase => {
  if (shotSteps.length === 0) return "pending";
  if (shotSteps.some((step) => step.status === "FAILED")) return "failed";

  const isEveryStepDone = shotSteps.every(
    (step) => step.status === "COMPLETED" || step.status === "SKIPPED"
  );
  if (isEveryStepDone) return "completed";

  const startedChain = CHAIN_PRECEDENCE_FOR_SHOT_PHASE.find(({ toolNames }) =>
    hasStartedStepInChain(shotSteps, toolNames)
  );
  return startedChain?.phase ?? "pending";
};

const deriveAggregatePhase = (
  shotPhases: BulkRendersRunShotPhase[]
): BulkRendersRunAggregatePhase => {
  if (shotPhases.length === 0) return "pending";

  const isEveryShotTerminal = shotPhases.every(
    (phase) => phase === "completed" || phase === "failed"
  );
  if (isEveryShotTerminal) return "completed";

  const earliestActivePhase = AGGREGATE_PHASE_PRECEDENCE.find((phase) =>
    shotPhases.includes(phase)
  );
  return earliestActivePhase ?? "completed";
};

export const deriveBulkRendersRunShotPhases = ({
  shotIds,
  steps,
  hasRunFailed = false
}: {
  shotIds: string[];
  steps: BulkRendersRunStep[];
  /* A run can fail before it writes a single step row, and the per-Shot derivation has nothing to
   * read in that case. Without this the run reads as pending forever. */
  hasRunFailed?: boolean;
}): BulkRendersRunShotPhases => {
  const byShotId: Record<string, BulkRendersRunShotPhase> = Object.create(null);

  for (const shotId of shotIds) {
    const shotSteps = steps.filter((step) => step.timeline_id === shotId);
    byShotId[shotId] = deriveShotPhase(shotSteps);
  }

  return {
    byShotId,
    aggregate: hasRunFailed
      ? "failed"
      : deriveAggregatePhase(Object.values(byShotId))
  };
};
