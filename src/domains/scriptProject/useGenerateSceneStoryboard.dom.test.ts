import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGenerateSceneStoryboard } from "./useGenerateSceneStoryboard";
import { Beat } from "./utils/shotCutListTypes";

const uploadReferenceImage = vi.hoisted(() => vi.fn());
vi.mock("@domains/asset/useUploadReferenceImage", () => ({
  useUploadReferenceImage: () => ({ mutateAsync: uploadReferenceImage })
}));

const renderShotStoryboard = vi.hoisted(() => vi.fn());
vi.mock("./data/useRenderShotStoryboard", () => ({
  useRenderShotStoryboard: () => ({ mutateAsync: renderShotStoryboard })
}));

const editSheetGroup = vi.hoisted(() => vi.fn());
vi.mock("./data/useEditSheetGroup", () => ({
  useEditSheetGroup: () => ({ mutateAsync: editSheetGroup })
}));

const pinSheetGroupImage = vi.hoisted(() => vi.fn());
vi.mock("./data/usePinSheetGroupImage", () => ({
  usePinSheetGroupImage: () => ({ mutateAsync: pinSheetGroupImage })
}));

vi.mock("./renderStoryboardInputImage", () => ({
  renderStoryboardInputImage: async () =>
    new File(["grid"], "grid.png", { type: "image/png" })
}));

const reportScriptProjectFailure = vi.hoisted(() => vi.fn());
vi.mock("./useReportScriptProjectFailure", () => ({
  useReportScriptProjectFailure: () => reportScriptProjectFailure
}));

const storyboardBeats: Beat[] = [
  {
    framing: "",
    action: "The hero walks in",
    cameraMovement: "",
    cameraSentenceKind: "none",
    spokenLines: "",
    durationSeconds: 3
  }
];

const sceneWithTimelineId = (timelineId: string) => ({
  timeline_id: timelineId,
  tags: { characters: [], environments: [], props: [] }
});

const renderStoryboardHook = () => {
  const onStoryboardRenderAccepted = vi.fn();
  const { result } = renderHook(() =>
    useGenerateSceneStoryboard({
      projectId: "project",
      sheetsTimelineId: "sheets-timeline",
      projectOutputSize: [1920, 1080],
      sheetGroups: [],
      storyboardSheetGroups: [],
      onStoryboardRenderAccepted
    })
  );
  return { result, onStoryboardRenderAccepted };
};

describe("useGenerateSceneStoryboard", () => {
  beforeEach(() => {
    uploadReferenceImage.mockReset().mockResolvedValue("grid-asset");
    renderShotStoryboard.mockReset();
    editSheetGroup.mockReset().mockResolvedValue(undefined);
    pinSheetGroupImage.mockReset().mockResolvedValue(undefined);
    reportScriptProjectFailure.mockReset();
  });

  it("reports a scene's render as accepted only once the render request succeeds", async () => {
    let acceptRender: () => void = () => {};
    renderShotStoryboard.mockReturnValue(
      new Promise<void>((resolve) => {
        acceptRender = resolve;
      })
    );
    const { result, onStoryboardRenderAccepted } = renderStoryboardHook();

    act(() =>
      result.current.generateSceneStoryboard({
        shot: sceneWithTimelineId("scene-a"),
        storyboardBeats
      })
    );
    await waitFor(() => expect(renderShotStoryboard).toHaveBeenCalled());
    expect(onStoryboardRenderAccepted).not.toHaveBeenCalled();

    await act(async () => acceptRender());

    expect(onStoryboardRenderAccepted).toHaveBeenCalledWith("scene-a");
    expect(result.current.isSubmittingSceneStoryboard("scene-a")).toBe(false);
  });

  it("reports every scene sent at once, not only the last one", async () => {
    renderShotStoryboard.mockResolvedValue(undefined);
    const { result, onStoryboardRenderAccepted } = renderStoryboardHook();

    act(() => {
      result.current.generateSceneStoryboard({
        shot: sceneWithTimelineId("scene-a"),
        storyboardBeats
      });
      result.current.generateSceneStoryboard({
        shot: sceneWithTimelineId("scene-b"),
        storyboardBeats
      });
    });

    await waitFor(() =>
      expect(onStoryboardRenderAccepted).toHaveBeenCalledTimes(2)
    );
    expect(onStoryboardRenderAccepted).toHaveBeenCalledWith("scene-a");
    expect(onStoryboardRenderAccepted).toHaveBeenCalledWith("scene-b");
    expect(result.current.isSubmittingSceneStoryboard("scene-a")).toBe(false);
    expect(result.current.isSubmittingSceneStoryboard("scene-b")).toBe(false);
  });

  it("reports a refused render as a failure and never as accepted", async () => {
    renderShotStoryboard.mockRejectedValue(new Error("refused"));
    const { result, onStoryboardRenderAccepted } = renderStoryboardHook();

    act(() =>
      result.current.generateSceneStoryboard({
        shot: sceneWithTimelineId("scene-a"),
        storyboardBeats
      })
    );

    await waitFor(() => expect(reportScriptProjectFailure).toHaveBeenCalled());
    expect(onStoryboardRenderAccepted).not.toHaveBeenCalled();
    expect(result.current.isSubmittingSceneStoryboard("scene-a")).toBe(false);
  });

  it("retries only the sheet setup, never the paid render, when setup fails after the render was accepted", async () => {
    renderShotStoryboard.mockResolvedValue(undefined);
    editSheetGroup.mockRejectedValueOnce(new Error("sheet edit failed"));
    const { result, onStoryboardRenderAccepted } = renderStoryboardHook();

    act(() =>
      result.current.generateSceneStoryboard({
        shot: sceneWithTimelineId("scene-a"),
        storyboardBeats
      })
    );
    await waitFor(() => expect(reportScriptProjectFailure).toHaveBeenCalled());
    expect(onStoryboardRenderAccepted).toHaveBeenCalledWith("scene-a");

    const retry = reportScriptProjectFailure.mock.calls[0][2] as () => void;
    await act(async () => retry());

    await waitFor(() => expect(editSheetGroup).toHaveBeenCalledTimes(2));
    expect(renderShotStoryboard).toHaveBeenCalledTimes(1);
    expect(uploadReferenceImage).toHaveBeenCalledTimes(1);
  });
});
