const UNFINISHED_STATUSES = new Set(["PENDING", "INQUEUE", "INPROGRESS"]);

export const getUnfinishedQueuePositions = (
  jobs: Array<{ id: string; status: string }>
): Map<string, number> => {
  const positions = new Map<string, number>();
  let position = 0;
  for (const job of jobs) {
    if (!UNFINISHED_STATUSES.has(job.status)) continue;
    positions.set(job.id, position);
    position += 1;
  }
  return positions;
};
