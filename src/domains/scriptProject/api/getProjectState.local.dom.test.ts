import { afterEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get }
}));

import { getProjectCut } from "./getProjectCut.local";
import { getProjectScriptVersions } from "./getProjectScriptVersions.local";
import { getProjectState } from "./getProjectState.local";

const cachedState = {
  project_id: "script-1",
  sheets_timeline_id: null,
  keys: [],
  shots: [{ timeline_id: "shot-1", shot_index: 0, sequence_id: 1 }]
};

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("getProjectState (desktop)", () => {
  it("keeps downloaded URLs local during a cloud refetch without starting another transfer", async () => {
    const cut = {
      project_id: "script-1",
      shots: [],
      missing: [],
      export: {
        asset_id: "cached-video",
        url: "mago-media://script-project/cached-video",
        stale: false
      }
    };
    get.mockResolvedValue({
      data: {
        ...cut,
        export: { ...cut.export, url: "https://storage.example/cached.mp4" }
      }
    });
    const put = vi.fn().mockResolvedValue(undefined);
    const cacheMedia = vi.fn();
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      projects: { get: vi.fn().mockResolvedValue({ origin: "cloud" }) },
      scriptProjects: {
        get: vi.fn().mockResolvedValue({
          state: null,
          cut,
          scriptVersions: null,
          planDetails: null
        }),
        put,
        cacheMedia
      }
    });
    await expect(
      getProjectCut("script-1", { preferCache: false })
    ).resolves.toMatchObject({ export: { url: cut.export.url } });
    expect(put).toHaveBeenCalledWith(
      expect.objectContaining({ metadataOnly: true })
    );
    expect(cacheMedia).not.toHaveBeenCalled();
  });
  it("reads the durable snapshot without requesting cloud in offline mode", async () => {
    vi.stubGlobal("mago", {
      account: { mode: "offline" },
      scriptProjects: {
        get: vi.fn().mockResolvedValue({
          state: cachedState,
          scriptVersions: null,
          cut: null
        })
      }
    });

    await expect(getProjectState("script-1")).resolves.toMatchObject({
      project_id: "script-1",
      shots: [expect.objectContaining({ timeline_id: "shot-1" })]
    });
    expect(get).not.toHaveBeenCalled();
  });

  it("falls back to the snapshot when a cloud refresh fails", async () => {
    get.mockRejectedValue(new Error("offline"));
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      scriptProjects: {
        get: vi.fn().mockResolvedValue({
          state: cachedState,
          scriptVersions: null,
          cut: null
        })
      }
    });

    await expect(
      getProjectState("script-1", { preferCache: false })
    ).resolves.toMatchObject({ project_id: "script-1" });
    expect(get).toHaveBeenCalledWith("/projects/script-1/state");
  });

  it("keeps every local snapshot section authoritative during a forced refetch", async () => {
    const scriptVersions = {
      active_version: 1,
      versions: [{ version: 1, status: "COMPLETED" }]
    };
    const cut = {
      project_id: "script-1",
      shots: [
        {
          timeline_id: "shot-1",
          shot_index: 0,
          sequence_id: 1,
          asset_id: "video-1",
          pinned_asset_id: null,
          url: "mago-media://script-project/video-1",
          poster_url: "mago-media://script-project/poster-1",
          versions: []
        }
      ],
      missing: [],
      export: null
    };
    const snapshotGet = vi.fn().mockResolvedValue({
      state: cachedState,
      scriptVersions,
      cut
    });
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      projects: {
        get: vi.fn().mockResolvedValue({
          id: "script-1",
          origin: "local"
        })
      },
      scriptProjects: { get: snapshotGet }
    });

    await expect(
      getProjectState("script-1", { preferCache: false })
    ).resolves.toMatchObject({ project_id: "script-1" });
    await expect(
      getProjectScriptVersions("script-1", { preferCache: false })
    ).resolves.toMatchObject({ active_version: 1, versions: [{ version: 1 }] });
    await expect(
      getProjectCut("script-1", { preferCache: false })
    ).resolves.toMatchObject({
      shots: [expect.objectContaining({ asset_id: "video-1" })]
    });
    expect(snapshotGet).toHaveBeenCalledTimes(3);
    expect(get).not.toHaveBeenCalled();
  });
});
