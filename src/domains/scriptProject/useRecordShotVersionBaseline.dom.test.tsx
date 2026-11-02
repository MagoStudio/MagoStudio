import { ProjectCutSchema } from "@schemas/scriptProject";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildProjectCutQueryOptions } from "./data/buildProjectCutQueryOptions";
import { useRecordShotVersionBaseline } from "./useRecordShotVersionBaseline";
import { useShotVersionReview } from "./useShotVersionReview";

const signedInUser = vi.hoisted(() => ({
  current: { id: "user" } as { id: string } | undefined
}));
vi.mock("@platform/identity", () => ({
  useUser: () => ({ user: signedInUser.current })
}));

const cutWithVersions = (assetIds: string[]) =>
  ProjectCutSchema.parse({
    project_id: "project",
    shots: [
      {
        timeline_id: "scene",
        shot_index: 0,
        sequence_id: 1,
        versions: assetIds.map((assetId) => ({
          layer_id: "layer",
          asset_id: assetId,
          ready: true,
          status: "finished"
        }))
      }
    ]
  });

const renderWithCut = (queryClient: QueryClient) =>
  renderHook(
    () => {
      useRecordShotVersionBaseline("project");
      return useShotVersionReview("project");
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }
  );

beforeEach(() => {
  window.localStorage.clear();
  signedInUser.current = { id: "user" };
});

describe("useRecordShotVersionBaseline", () => {
  it("counts every version that already exists on the first visit as seen", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      buildProjectCutQueryOptions("project").queryKey,
      cutWithVersions(["old-take", "older-take"])
    );

    const review = renderWithCut(queryClient);

    await waitFor(() =>
      expect(review.result.current.isVersionBaselineRecorded).toBe(true)
    );
    expect(review.result.current.viewedVersionIds).toEqual(
      new Set(["old-take", "older-take"])
    );
  });

  it("leaves a version rendered after the first visit unseen", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      buildProjectCutQueryOptions("project").queryKey,
      cutWithVersions(["old-take"])
    );
    const firstVisit = renderWithCut(queryClient);
    await waitFor(() =>
      expect(firstVisit.result.current.isVersionBaselineRecorded).toBe(true)
    );
    firstVisit.unmount();

    queryClient.setQueryData(
      buildProjectCutQueryOptions("project").queryKey,
      cutWithVersions(["old-take", "fresh-take"])
    );
    const laterVisit = renderWithCut(queryClient);

    expect(laterVisit.result.current.viewedVersionIds.has("old-take")).toBe(
      true
    );
    expect(laterVisit.result.current.viewedVersionIds.has("fresh-take")).toBe(
      false
    );
  });

  it("records the baseline once the signed-in user loads after mount", async () => {
    signedInUser.current = undefined;
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      buildProjectCutQueryOptions("project").queryKey,
      cutWithVersions(["old-take"])
    );
    const review = renderWithCut(queryClient);
    expect(review.result.current.isVersionBaselineRecorded).toBe(false);

    signedInUser.current = { id: "user" };
    review.rerender();

    await waitFor(() =>
      expect(review.result.current.isVersionBaselineRecorded).toBe(true)
    );
    expect(review.result.current.viewedVersionIds).toEqual(
      new Set(["old-take"])
    );
  });
});
