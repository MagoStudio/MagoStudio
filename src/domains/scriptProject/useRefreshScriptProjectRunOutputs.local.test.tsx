import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { useRefreshScriptProjectRunOutputs } from "./useRefreshScriptProjectRunOutputs.local";

const PROJECT_ID = "project-1";

let projectRuns: Array<Record<string, unknown>> | undefined;
let projectOrigin: "local" | "cloud";

vi.mock("@domains/bulkRendersRun/useBulkRendersRuns", () => ({
  useBulkRendersRunsForProject: () => ({ data: projectRuns })
}));

vi.mock("@domains/project/useProject", () => ({
  useProject: () => ({ data: { origin: projectOrigin } })
}));

const shotRun = (completedSteps: number, status = "RUNNING") => ({
  id: "run-1",
  status,
  completed_steps: completedSteps,
  progress_pct: completedSteps * 10,
  input_settings: { timeline_ids: ["timeline-1"] }
});

const renderObserver = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useRefreshScriptProjectRunOutputs(PROJECT_ID), {
    wrapper
  });
  return { ...hook, invalidateSpy };
};

describe("useRefreshScriptProjectRunOutputs", () => {
  beforeEach(() => {
    projectRuns = undefined;
    projectOrigin = "local";
  });

  it("refreshes a reopened project's persisted video output on the first durable run revision", async () => {
    const { rerender, invalidateSpy } = renderObserver();

    projectRuns = [shotRun(12, "COMPLETED")];
    rerender();

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.projectCut.byProjectId(PROJECT_ID)
      })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectState.byProjectId(PROJECT_ID)
    });
  });

  it("refreshes after every new background-plan revision but not for an unchanged poll", async () => {
    projectRuns = [shotRun(3)];
    const { rerender, invalidateSpy } = renderObserver();
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(2));
    invalidateSpy.mockClear();

    projectRuns = [shotRun(3)];
    rerender();
    expect(invalidateSpy).not.toHaveBeenCalled();

    projectRuns = [shotRun(4)];
    rerender();
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(2));
  });

  it("ignores sheet plans because they cannot add videos to the Cut", () => {
    projectRuns = [
      {
        ...shotRun(2),
        input_settings: { timeline_ids: [] }
      }
    ];
    const { invalidateSpy } = renderObserver();

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("leaves mirrored cloud projects on the production refresh lifecycle", () => {
    projectOrigin = "cloud";
    projectRuns = [shotRun(12, "COMPLETED")];
    const { invalidateSpy } = renderObserver();

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
