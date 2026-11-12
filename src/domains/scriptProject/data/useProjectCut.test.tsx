import { ProjectCut, ProjectCutSchema } from "@schemas/scriptProject";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CUT_POLL_INTERVAL_MS, useProjectCut } from "./useProjectCut";

const PROJECT_ID = "project";

const backend = vi.hoisted(() => ({
  cut: undefined as ProjectCut | undefined,
  cutRequestCount: 0
}));
vi.mock("../api/getProjectCut", () => ({
  getProjectCut: async () => {
    backend.cutRequestCount += 1;
    return backend.cut;
  }
}));

const buildCut = (
  versions: Record<string, unknown>[],
  assetId: string | null
) =>
  ProjectCutSchema.parse({
    project_id: PROJECT_ID,
    shots: [
      {
        timeline_id: "scene",
        shot_index: 0,
        sequence_id: 1,
        asset_id: assetId,
        versions: versions.map((version, index) => ({
          layer_id: `layer-${index}`,
          ...version
        }))
      }
    ]
  });

const renderUseProjectCut = (isAnyShotRendering = false) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return renderHook(() => useProjectCut(PROJECT_ID, { isAnyShotRendering }), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  });
};

const advancePastOnePoll = () =>
  act(() => vi.advanceTimersByTimeAsync(CUT_POLL_INTERVAL_MS + 1));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  backend.cutRequestCount = 0;
});
afterEach(() => vi.useRealTimers());

describe("useProjectCut", () => {
  it("keeps re-reading the cut while a render waits for its dub, then shows the dubbed take", async () => {
    backend.cut = buildCut(
      [{ asset_id: "render", ready: true, awaiting_dub: true }],
      null
    );
    const { result } = renderUseProjectCut();
    await waitFor(() =>
      expect(result.current.data?.shots[0]?.isSceneHiddenUntilDubLands).toBe(
        true
      )
    );

    backend.cut = buildCut([{ asset_id: "render", ready: true }], "render");
    await advancePastOnePoll();

    await waitFor(() =>
      expect(result.current.data?.shots[0]?.asset_id).toBe("render")
    );
    expect(result.current.data?.shots[0]?.isSceneHiddenUntilDubLands).toBe(
      false
    );
  });

  it("keeps re-reading the cut while a render is still running", async () => {
    backend.cut = buildCut([{ asset_id: "render", ready: false }], null);
    renderUseProjectCut();
    await waitFor(() => expect(backend.cutRequestCount).toBe(1));
    await advancePastOnePoll();
    await waitFor(() => expect(backend.cutRequestCount).toBe(2));
  });

  it("re-reads the cut while the backend says a scene is rendering, even before its render exists", async () => {
    backend.cut = buildCut([], null);
    renderUseProjectCut(true);
    await waitFor(() => expect(backend.cutRequestCount).toBe(1));
    await advancePastOnePoll();
    await waitFor(() => expect(backend.cutRequestCount).toBe(2));
  });

  it("stops re-reading a cut with nothing in flight", async () => {
    backend.cut = buildCut([{ asset_id: "render", ready: true }], "render");
    renderUseProjectCut();
    await waitFor(() => expect(backend.cutRequestCount).toBe(1));
    await advancePastOnePoll();
    await advancePastOnePoll();
    expect(backend.cutRequestCount).toBe(1);
  });
});
