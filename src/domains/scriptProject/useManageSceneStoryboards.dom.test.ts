import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useManageSceneStoryboards } from "./useManageSceneStoryboards";

const submitSceneStoryboard = vi.hoisted(() => vi.fn());
vi.mock("./data/useSubmitSceneStoryboard", () => ({
  useSubmitSceneStoryboard: () => ({ mutateAsync: submitSceneStoryboard })
}));

const updateSceneStoryboard = vi.hoisted(() => vi.fn());
vi.mock("./data/useUpdateSceneStoryboard", () => ({
  useUpdateSceneStoryboard: () => ({
    mutate: updateSceneStoryboard,
    isPending: false
  })
}));

const reportScriptProjectFailure = vi.hoisted(() => vi.fn());
vi.mock("./useReportScriptProjectFailure", () => ({
  useReportScriptProjectFailure: () => reportScriptProjectFailure
}));

describe("useManageSceneStoryboards", () => {
  beforeEach(() => {
    submitSceneStoryboard.mockReset();
    updateSceneStoryboard.mockReset();
    reportScriptProjectFailure.mockReset();
  });

  it("asks the backend to draw the scene's storyboard and clears the submitting state", async () => {
    submitSceneStoryboard.mockResolvedValue({
      timeline_id: "scene",
      asset_id: "asset"
    });
    const { result } = renderHook(() => useManageSceneStoryboards("project"));

    await act(() => result.current.generateSceneStoryboard("scene"));

    expect(submitSceneStoryboard).toHaveBeenCalledWith({
      projectId: "project",
      sceneTimelineId: "scene"
    });
    expect(result.current.isSubmittingSceneStoryboard("scene")).toBe(false);
  });

  it("reports a refused Generate with a retry that asks again", async () => {
    submitSceneStoryboard.mockRejectedValueOnce(new Error("locked"));
    const { result } = renderHook(() => useManageSceneStoryboards("project"));

    await act(() => result.current.generateSceneStoryboard("scene"));
    expect(reportScriptProjectFailure).toHaveBeenCalledTimes(1);

    submitSceneStoryboard.mockResolvedValue({
      timeline_id: "scene",
      asset_id: "asset"
    });
    const retry = reportScriptProjectFailure.mock.calls[0]![2] as () => void;
    await act(async () => retry());
    expect(submitSceneStoryboard).toHaveBeenCalledTimes(2);
  });

  it("switches a scene's storyboard off for video renders", () => {
    const { result } = renderHook(() => useManageSceneStoryboards("project"));
    result.current.setSceneStoryboardUsedInVideoRenders("scene", false);
    expect(updateSceneStoryboard).toHaveBeenCalledWith(
      {
        projectId: "project",
        sceneTimelineId: "scene",
        isUsedInVideoRenders: false
      },
      expect.anything()
    );
  });

  it("marks only the scene being updated as busy, until its update settles", () => {
    const { result } = renderHook(() => useManageSceneStoryboards("project"));

    act(() => result.current.pinSceneStoryboardVersion("scene", "v1"));
    expect(result.current.isUpdatingSceneStoryboard("scene")).toBe(true);
    expect(result.current.isUpdatingSceneStoryboard("other-scene")).toBe(false);

    const { onSettled } = updateSceneStoryboard.mock.calls[0]![1] as {
      onSettled: () => void;
    };
    act(() => onSettled());
    expect(result.current.isUpdatingSceneStoryboard("scene")).toBe(false);
  });
});
