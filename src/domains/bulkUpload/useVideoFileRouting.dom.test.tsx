import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { createStore, Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { useProject } = vi.hoisted(() => ({ useProject: vi.fn() }));

vi.mock("@domains/project/useProject", () => ({ useProject }));

import { addVideoRequestAtom } from "@store/atoms";

import { useVideoFileRouting } from "./useVideoFileRouting";

const video = (name: string) => new File(["x"], name, { type: "video/mp4" });

const setup = (origin: "local" | "cloud") => {
  useProject.mockReturnValue({ data: { id: "project-1", origin } });
  vi.stubGlobal("mago", {});
  const store = createStore();
  const startBulkUpload = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>
      <JotaiProvider store={store}>{children}</JotaiProvider>
    </QueryClientProvider>
  );
  const { result } = renderHook(
    () => useVideoFileRouting("project-1", startBulkUpload),
    { wrapper }
  );
  return { route: result.current, store, startBulkUpload };
};

describe("useVideoFileRouting (desktop)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("opens the trim modal for a single video added to a cloud project", () => {
    const { route, store, startBulkUpload } = setup("cloud");
    const file = video("a.mp4");

    route([file]);

    expect(store.get(addVideoRequestAtom)).toEqual({
      file,
      existingProjectId: "project-1"
    });
    expect(startBulkUpload).not.toHaveBeenCalled();
  });

  it("uploads several videos to a cloud project through the bulk uploader", () => {
    const { route, store, startBulkUpload } = setup("cloud");

    route([video("a.mp4"), video("b.mp4")], "folder-1");

    expect(store.get(addVideoRequestAtom)).toBeNull();
    expect(startBulkUpload).toHaveBeenCalledWith(
      expect.any(Array),
      "project-1",
      "folder-1"
    );
  });

  it("imports a single video into a local project without a trim modal", () => {
    const { route, store, startBulkUpload } = setup("local");

    route([video("a.mp4")]);

    expect(store.get(addVideoRequestAtom)).toBeNull();
    expect(startBulkUpload).toHaveBeenCalledOnce();
  });
});
