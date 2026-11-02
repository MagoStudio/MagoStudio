import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/queryKeys";

import { useCloudProjectSync } from "./useCloudProjectSync.local";

const mocks = vi.hoisted(() => ({
  syncProjects: vi.fn().mockResolvedValue(undefined),
  syncProject: vi.fn().mockResolvedValue(undefined),
  cancelCatalog: vi.fn(),
  deferCatalog: vi.fn(),
  cancelProject: vi.fn(),
  subscribeStatus: vi.fn(() => () => undefined),
  subscribeMetadata: vi.fn(() => () => undefined),
  subscribeAssetReady: vi.fn(
    (_listener: (projectId: string, assetId: string) => void) => () => undefined
  )
}));

vi.mock("./syncCloudScriptProjects", () => ({
  cancelCloudProjectCatalogSync: mocks.cancelCatalog,
  cancelCloudProjectSync: mocks.cancelProject,
  deferCloudProjectCatalogSync: mocks.deferCatalog,
  getCloudProjectSyncStatus: () => false,
  promoteCloudTimeline: vi.fn(),
  subscribeCloudAssetReady: mocks.subscribeAssetReady,
  subscribeCloudProjectMetadata: mocks.subscribeMetadata,
  subscribeCloudProjectSyncStatus: mocks.subscribeStatus,
  syncCloudProject: mocks.syncProject,
  syncCloudScriptProjects: mocks.syncProjects
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("useCloudProjectSync", () => {
  it("invalidates background assets while another cached project is open", async () => {
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      projects: { get: vi.fn().mockResolvedValue({ origin: "local" }) }
    });
    const client = new QueryClient();
    const videoKey = queryKeys.videoAsset.byId("background-asset");
    client.setQueryData(videoKey, { url: null });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const provider = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { rerender } = renderHook(
      ({ projectId }) => useCloudProjectSync(projectId),
      { wrapper: provider, initialProps: { projectId: "old" } }
    );
    rerender({ projectId: "cached-project" });
    const globalListener = mocks.subscribeAssetReady.mock.calls[0]![0];
    globalListener("old", "background-asset");
    expect(client.getQueryState(videoKey)?.isInvalidated).toBe(true);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["cached-video-preview", "background-asset"]
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["frame-generate", "background-asset"]
    });
    expect(
      mocks.subscribeAssetReady.mock.calls.filter(
        ([listener]) => listener === globalListener
      )
    ).toHaveLength(1);
  });
  it("reads selected metadata before refreshing a missing project", async () => {
    let finishProjectRead!: (project: null) => void;
    const get = vi.fn(
      () =>
        new Promise<null>((resolve) => {
          finishProjectRead = resolve;
        })
    );
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      projects: { get }
    });

    renderHook(() => useCloudProjectSync("project-1"), { wrapper });

    await waitFor(() => expect(get).toHaveBeenCalledOnce());
    expect(mocks.syncProjects).not.toHaveBeenCalled();
    expect(mocks.syncProject).not.toHaveBeenCalled();

    finishProjectRead(null);

    await waitFor(() =>
      expect(mocks.syncProject).toHaveBeenCalledWith("project-1")
    );
    expect(mocks.syncProjects).not.toHaveBeenCalled();
  });
  it("leaves project downloads running when navigation unmounts the hook", async () => {
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      projects: { get: vi.fn().mockResolvedValue({ origin: "cloud" }) }
    });
    const { unmount } = renderHook(
      () => useCloudProjectSync("background-project"),
      { wrapper }
    );
    await waitFor(() =>
      expect(mocks.syncProject).toHaveBeenCalledWith("background-project")
    );
    unmount();
    expect(mocks.cancelProject).not.toHaveBeenCalled();
  });

  it("does not start or await cloud synchronization for a local project", async () => {
    const get = vi.fn().mockResolvedValue({
      id: "project-1",
      origin: "local"
    });
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      projects: { get }
    });

    renderHook(() => useCloudProjectSync("project-1"), { wrapper });

    await waitFor(() => expect(get).toHaveBeenCalledOnce());
    expect(mocks.syncProjects).not.toHaveBeenCalled();
    expect(mocks.syncProject).not.toHaveBeenCalled();
  });

  it("refreshes the catalog in the background only on the homepage", async () => {
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      projects: { get: vi.fn() }
    });

    renderHook(() => useCloudProjectSync(), { wrapper });

    await waitFor(() => expect(mocks.syncProjects).toHaveBeenCalledOnce());
    expect(mocks.syncProject).not.toHaveBeenCalled();
  });
});
