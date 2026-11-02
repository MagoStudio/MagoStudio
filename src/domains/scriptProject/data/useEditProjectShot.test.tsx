import { ProjectState } from "@schemas/scriptProject";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { useEditProjectShot } from "./useEditProjectShot";

const { patchProjectShot } = vi.hoisted(() => ({
  patchProjectShot: vi.fn()
}));

vi.mock("../api/patchProjectShot", () => ({ patchProjectShot }));

const PROJECT_ID = "project-1";
const PROJECT_STATE: ProjectState = {
  project_id: PROJECT_ID,
  sheets_timeline_id: null,
  sequential_prompt_defaults: null,
  keys: [],
  shots: [
    {
      timeline_id: "shot-1",
      shot_index: 0,
      sequence_id: 1,
      dropped: false,
      hidden: false,
      manual: false,
      tags: { characters: [], environments: [], props: [] },
      references: {},
      missing_references: []
    }
  ]
};

const renderWithClient = (onError = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } }
  });
  queryClient.setQueryData(
    queryKeys.projectState.byProjectId(PROJECT_ID),
    PROJECT_STATE
  );
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useEditProjectShot({ onError }), { wrapper });
  return { ...hook, queryClient, onError };
};

describe("useEditProjectShot", () => {
  it("shows a lock toggle in the project state cache immediately", async () => {
    let resolveRequest!: (value: {
      timeline_id: string;
      locked: boolean;
    }) => void;
    patchProjectShot.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const { result, queryClient } = renderWithClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    let request!: Promise<unknown>;
    act(() => {
      request = result.current.mutateAsync({
        projectId: PROJECT_ID,
        timelineId: "shot-1",
        isShotLocked: true
      });
    });

    await waitFor(() =>
      expect(
        queryClient.getQueryData<ProjectState>(
          queryKeys.projectState.byProjectId(PROJECT_ID)
        )?.shots[0]?.locked
      ).toBe(true)
    );

    resolveRequest({ timeline_id: "shot-1", locked: true });
    await act(() => request);

    expect(
      queryClient.getQueryData<ProjectState>(
        queryKeys.projectState.byProjectId(PROJECT_ID)
      )?.shots[0]?.locked
    ).toBe(true);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectState.byProjectId(PROJECT_ID),
      refetchType: "none"
    });
  });

  it("restores the previous lock state when the update fails", async () => {
    const failure = new Error("update failed");
    patchProjectShot.mockRejectedValueOnce(failure);
    const { result, queryClient, onError } = renderWithClient();

    await act(async () => {
      await result.current
        .mutateAsync({
          projectId: PROJECT_ID,
          timelineId: "shot-1",
          isShotLocked: true
        })
        .catch(() => undefined);
    });

    expect(
      queryClient.getQueryData<ProjectState>(
        queryKeys.projectState.byProjectId(PROJECT_ID)
      )?.shots[0]?.locked
    ).toBeUndefined();
    expect(onError).toHaveBeenCalledWith(failure, {
      projectId: PROJECT_ID,
      timelineId: "shot-1",
      isShotLocked: true
    });
  });

  it("shows a move immediately and refreshes the project state and cut", async () => {
    patchProjectShot.mockResolvedValueOnce({ timeline_id: "shot-2" });
    const { result, queryClient } = renderWithClient();
    queryClient.setQueryData(queryKeys.projectState.byProjectId(PROJECT_ID), {
      ...PROJECT_STATE,
      shots: [
        PROJECT_STATE.shots[0],
        { ...PROJECT_STATE.shots[0], timeline_id: "shot-2", shot_index: 1 }
      ]
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await act(() =>
      result.current.mutateAsync({
        projectId: PROJECT_ID,
        timelineId: "shot-2",
        shotIndex: 0
      })
    );

    expect(
      queryClient
        .getQueryData<ProjectState>(
          queryKeys.projectState.byProjectId(PROJECT_ID)
        )
        ?.shots.map((shot) => shot.timeline_id)
    ).toEqual(["shot-2", "shot-1"]);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectState.byProjectId(PROJECT_ID)
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectCut.byProjectId(PROJECT_ID)
    });
  });

  it("does not refetch the cut after a lock-only edit", async () => {
    patchProjectShot.mockResolvedValueOnce({
      timeline_id: "shot-1",
      locked: true
    });
    const { result, queryClient } = renderWithClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await act(() =>
      result.current.mutateAsync({
        projectId: PROJECT_ID,
        timelineId: "shot-1",
        isShotLocked: true
      })
    );

    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: queryKeys.projectCut.byProjectId(PROJECT_ID)
    });
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: queryKeys.projectState.byProjectId(PROJECT_ID)
    });
  });
});
