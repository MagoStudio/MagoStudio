import { PlanStep } from "@schemas/plan";

export const listShotIdsInScriptOrder = (
  shotsChildSteps: PlanStep[]
): string[] => {
  const orderedShotIds: string[] = [];

  for (const step of [...shotsChildSteps].sort(
    (a, b) => a.step_order - b.step_order
  )) {
    const shotId = step.timeline_id;
    if (!shotId || orderedShotIds.includes(shotId)) continue;
    orderedShotIds.push(shotId);
  }

  return orderedShotIds;
};
