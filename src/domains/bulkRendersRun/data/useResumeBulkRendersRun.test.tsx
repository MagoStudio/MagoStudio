import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { useResumeBulkRendersRun } from "./useResumeBulkRendersRun";

vi.mock("../api/postBulkRendersRunResume", () => ({
  postBulkRendersRunResume: vi.fn(async () => undefined)
}));

const BULK_RUN_ID = "run-1";
const PROJECT_ID = "project-1";

const renderWithClient = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useResumeBulkRendersRun(), { wrapper });
  return { result, invalidateSpy };
};

describe("useResumeBulkRendersRun", () => {
  it("invalidates the run's progress, steps and both list keys on a successful resume", async () => {
    const { result, invalidateSpy } = renderWithClient();

    await act(() =>
      result.current.mutateAsync({
        bulkRunId: BULK_RUN_ID,
        projectId: PROJECT_ID
      })
    );

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([options]) => options?.queryKey
    );

    expect(invalidatedKeys).toContainEqual(
      queryKeys.bulkRendersRunProgress.byRunId(BULK_RUN_ID)
    );
    expect(invalidatedKeys).toContainEqual(
      queryKeys.bulkRendersRunSteps.byRunId(BULK_RUN_ID)
    );
    expect(invalidatedKeys).toContainEqual(
      queryKeys.bulkRendersRuns.everyProject()
    );
    expect(invalidatedKeys).toContainEqual(
      queryKeys.bulkRendersRuns.byProjectId(PROJECT_ID)
    );
  });
});
