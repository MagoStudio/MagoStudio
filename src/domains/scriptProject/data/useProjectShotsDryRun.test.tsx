import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { useProjectShotsDryRun } from "./useProjectShotsDryRun";

const { postGenerateProjectShots } = vi.hoisted(() => ({
  postGenerateProjectShots: vi.fn()
}));

vi.mock("../api/postGenerateProjectShots", () => ({
  postGenerateProjectShots
}));

it("keeps named hidden-shot eligibility separate from the bulk dry run", async () => {
  postGenerateProjectShots.mockImplementation(async (request) => ({
    would_run_timeline_ids: request.timelineIds ?? [],
    would_run: []
  }));
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => ({
      bulk: useProjectShotsDryRun("project-1", [1280, 720]),
      named: useProjectShotsDryRun(
        "project-1",
        [1280, 720],
        undefined,
        undefined,
        true,
        ["hidden-shot"]
      )
    }),
    { wrapper }
  );
  await waitFor(() => {
    expect(result.current.bulk.isSuccess).toBe(true);
    expect(result.current.named.isSuccess).toBe(true);
  });
  expect(result.current.bulk.data?.would_run_timeline_ids).toEqual([]);
  expect(result.current.named.data?.would_run_timeline_ids).toEqual([
    "hidden-shot"
  ]);
  expect(postGenerateProjectShots).toHaveBeenCalledWith(
    expect.objectContaining({
      isDryRun: true,
      timelineIds: ["hidden-shot"]
    })
  );
});
