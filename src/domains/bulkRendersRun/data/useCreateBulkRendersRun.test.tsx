import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { useCreateBulkRendersRun } from "./useCreateBulkRendersRun";

vi.mock("../api/postBulkRendersRun", () => ({
  postBulkRendersRun: vi.fn(async () => ({
    id: "run-1",
    status: "PENDING"
  }))
}));

const PROJECT_ID = "project-1";

const renderWithClient = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCreateBulkRendersRun(), { wrapper });
  return { result, invalidateSpy };
};

describe("useCreateBulkRendersRun", () => {
  it("refreshes the Project's run list from the request's Project id, so a response omitting the field still refreshes", async () => {
    const { result, invalidateSpy } = renderWithClient();

    await act(() =>
      result.current.mutateAsync({
        project_id: PROJECT_ID,
        timeline_ids: ["shot-1"]
      })
    );

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.bulkRendersRuns.byProjectId(PROJECT_ID)
    });
  });

  it("never keys the invalidation off the response, which carries no Project id at all", async () => {
    const { result, invalidateSpy } = renderWithClient();

    await act(() =>
      result.current.mutateAsync({
        project_id: PROJECT_ID,
        timeline_ids: ["shot-1"]
      })
    );

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([options]) => options?.queryKey
    );

    for (const invalidatedKey of invalidatedKeys) {
      expect(invalidatedKey).not.toContain(undefined);
    }
  });
});
