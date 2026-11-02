import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { useUpscaleProjectShots } from "./useUpscaleProjectShots";

vi.mock("../api/postUpscaleProjectShots", () => ({
  postUpscaleProjectShots: vi.fn(async () => ({
    would_run: [],
    skipped: [],
    blocked: [],
    plan_id: null
  }))
}));

const PROJECT_ID = "project-1";

const renderWithClient = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUpscaleProjectShots(), { wrapper });
  return { result, invalidateSpy };
};

describe("useUpscaleProjectShots", () => {
  it("invalidates the Project state so the upscalable count drops the queued Shots", async () => {
    const { result, invalidateSpy } = renderWithClient();

    await act(() =>
      result.current.mutateAsync({ projectId: PROJECT_ID, isDryRun: false })
    );

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectState.byProjectId(PROJECT_ID)
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectCut.byProjectId(PROJECT_ID)
    });
  });

  it("invalidates nothing for a dry run, since nothing was actually queued", async () => {
    const { result, invalidateSpy } = renderWithClient();

    await act(() =>
      result.current.mutateAsync({ projectId: PROJECT_ID, isDryRun: true })
    );

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
