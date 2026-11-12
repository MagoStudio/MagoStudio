import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { useRefreshCutWhileShotsRender } from "./useRefreshCutWhileShotsRender";

vi.mock("./api/getProjectCut", () => ({
  getProjectCut: async () => ({ project_id: "project", shots: [] })
}));

const renderRefresh = (initialRenderingIds: Set<string>) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const hook = renderHook(
    ({ renderingIds }) =>
      useRefreshCutWhileShotsRender("project", renderingIds),
    {
      initialProps: { renderingIds: initialRenderingIds },
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }
  );
  const invalidatedKeys = () =>
    invalidateQueries.mock.calls.map(([filters]) => filters?.queryKey);
  return { hook, invalidatedKeys };
};

describe("useRefreshCutWhileShotsRender", () => {
  it("re-reads the cut and project state once a scene stops rendering", () => {
    const { hook, invalidatedKeys } = renderRefresh(new Set(["scene"]));
    hook.rerender({ renderingIds: new Set() });

    expect(invalidatedKeys()).toEqual([
      queryKeys.projectCut.byProjectId("project"),
      queryKeys.projectState.byProjectId("project")
    ]);
  });

  it("does not re-read anything while the same scenes keep rendering", () => {
    const { hook, invalidatedKeys } = renderRefresh(new Set(["scene"]));
    hook.rerender({ renderingIds: new Set(["scene"]) });
    hook.rerender({ renderingIds: new Set(["scene", "another"]) });

    expect(invalidatedKeys()).toEqual([]);
  });
});
