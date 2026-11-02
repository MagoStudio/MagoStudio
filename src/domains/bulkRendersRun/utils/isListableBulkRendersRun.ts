import { BulkRendersRun } from "@schemas/bulkRendersRun";

export const isListableBulkRendersRun = (run: BulkRendersRun): boolean => {
  const localOperation = (run as Record<string, unknown>).local_operation;
  return (
    run.parent_plan_id === null &&
    (localOperation === undefined || localOperation === "shots")
  );
};
