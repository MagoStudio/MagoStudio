import { afterEach, expect, it, vi } from "vitest";

vi.mock("./syncCloudScriptProjects.local", () => ({
  hydrateScriptMedia: vi.fn()
}));

import {
  readScriptProjectSnapshot,
  writeScriptProjectSnapshot
} from "./scriptProjectSnapshot.local";

afterEach(() => vi.unstubAllGlobals());

const snapshot = {
  state: { project_id: "p" },
  scriptVersions: null,
  planDetails: null,
  cut: null
};

it("shares overlapping reads but reads fresh data after completion", async () => {
  const get = vi.fn().mockResolvedValue(snapshot);
  vi.stubGlobal("mago", { scriptProjects: { get } });
  const results = await Promise.all([
    readScriptProjectSnapshot("p"),
    readScriptProjectSnapshot("p"),
    readScriptProjectSnapshot("p")
  ]);
  expect(get).toHaveBeenCalledOnce();
  expect(results).toEqual([snapshot, snapshot, snapshot]);
  get.mockResolvedValue({ ...snapshot, state: { edited: true } });
  expect((await readScriptProjectSnapshot("p"))?.state).toEqual({
    edited: true
  });
  expect(get).toHaveBeenCalledTimes(2);
});

it("keeps projects separate and retries a failed read", async () => {
  const get = vi
    .fn()
    .mockRejectedValueOnce(new Error("read failed"))
    .mockResolvedValue(snapshot);
  vi.stubGlobal("mago", { scriptProjects: { get } });
  const failed = readScriptProjectSnapshot("p");
  const other = readScriptProjectSnapshot("other");
  await expect(failed).rejects.toThrow("read failed");
  await other;
  await expect(readScriptProjectSnapshot("p")).resolves.toEqual(snapshot);
  expect(get).toHaveBeenCalledTimes(3);
});

it("does not reuse a pre-write read or let its completion clear a newer read", async () => {
  let finishOld!: (value: typeof snapshot) => void;
  let finishNew!: (value: typeof snapshot) => void;
  const get = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOld = resolve;
        })
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishNew = resolve;
        })
    );
  const put = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("mago", {
    account: { mode: "offline" },
    scriptProjects: { get, put }
  });
  const old = readScriptProjectSnapshot("p");
  await writeScriptProjectSnapshot({ projectId: "p", state: { edited: true } });
  const fresh = readScriptProjectSnapshot("p");
  finishOld(snapshot);
  await old;
  expect(readScriptProjectSnapshot("p")).toBe(fresh);
  finishNew({ ...snapshot, state: { project_id: "updated" } });
  expect((await fresh)?.state).toEqual({ project_id: "updated" });
  expect(get).toHaveBeenCalledTimes(2);
});
