import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { invalidateCachesForEndedRenders } from "./invalidateCachesForEndedRenders";

describe("invalidateCachesForEndedRenders", () => {
  it("refreshes the script project cut so finished shot renders appear without a reload", () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    invalidateCachesForEndedRenders({
      queryClient,
      endedRenders: [{ assetId: "asset", hasEnded: true }]
    });

    const invalidatedKeys = invalidateQueries.mock.calls.map(
      ([filters]) => filters?.queryKey
    );
    expect(invalidatedKeys).toContainEqual(queryKeys.projectCut.all);
    expect(invalidatedKeys).toContainEqual(queryKeys.videoAsset.byId("asset"));
  });
});
