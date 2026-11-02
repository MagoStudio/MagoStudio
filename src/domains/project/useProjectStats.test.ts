import { describe, expect, it } from "vitest";

import { ProjectStatsResponse } from "./api/fetchProjectStats";
import { missingCostBackfillInterval } from "./useProjectStats";

const statsWithCost = (totalCost: number): ProjectStatsResponse =>
  ({ total: { total_cost: totalCost } }) as ProjectStatsResponse;

describe("missingCostBackfillInterval", () => {
  it("briefly retries while cloud cost aggregation is missing", () => {
    expect(missingCostBackfillInterval(statsWithCost(0), 1, true)).toBe(2500);
    expect(missingCostBackfillInterval(statsWithCost(12), 1, true)).toBe(false);
    expect(missingCostBackfillInterval(statsWithCost(0), 4, true)).toBe(false);
  });
});
