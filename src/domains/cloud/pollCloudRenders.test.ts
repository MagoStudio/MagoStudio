import { beforeEach, describe, expect, it, vi } from "vitest";

import { pollCloudRenders } from "./pollCloudRenders";

const makeBridge = () => {
  const finished: { jobId: string; url: string }[] = [];
  const failed: { jobId: string; message: string }[] = [];
  const statuses: { jobId: string; status: string; progress?: number }[] = [];
  let jobs: {
    id: string;
    cloudAssetId: string | null;
    projectId: string;
    status: string;
    progress?: number;
  }[] = [];
  const links = new Map<string, string>([["project:p1", "cloud-p1"]]);

  return {
    finished,
    failed,
    statuses,
    setJobs: (next: typeof jobs) => {
      jobs = next;
    },
    links,
    api: {
      cloud: {
        links: {
          get: vi.fn(async (kind: string, localId: string) => {
            const cloudId = links.get(`${kind}:${localId}`);
            return cloudId
              ? { kind, localId, cloudId, syncedAt: null, data: {} }
              : null;
          }),
          put: vi.fn(),
          patch: vi.fn()
        },
        prepareUpload: vi.fn(),
        uploadPrepared: vi.fn(),
        onUploadProgress: vi.fn(() => () => undefined),
        renders: {
          register: vi.fn(),
          listActive: vi.fn(async () => jobs),
          finish: vi.fn(async (input: { jobId: string; url: string }) => {
            finished.push(input);
          }),
          fail: vi.fn(async (input: { jobId: string; message: string }) => {
            failed.push(input);
          }),
          setStatus: vi.fn(
            async (input: {
              jobId: string;
              status: string;
              progress?: number;
            }) => {
              statuses.push(input);
            }
          )
        }
      }
    }
  };
};

let bridge = makeBridge();

vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => bridge.api
}));

const queueItem = (assetId: string, status: string, started = true) => ({
  id: `q-${assetId}`,
  status,
  asset_id: assetId,
  created_at: "2026-08-28T08:00:00+00:00",
  render_started_at: started ? "2026-08-28T08:00:05" : null,
  finished_at: status === "FINISHED" ? "2026-08-28T08:02:00" : null
});

const makeApi = (handlers: { get?: (url: string) => unknown }) => {
  const gets: string[] = [];
  return {
    gets,
    api: {
      post: vi.fn(async () => ({}) as never),
      get: vi.fn(async (url: string) => {
        gets.push(url);
        return (handlers.get?.(url) ?? {}) as never;
      })
    }
  };
};

beforeEach(() => {
  bridge = makeBridge();
});

describe("pollCloudRenders", () => {
  it("does nothing when no job is in flight", async () => {
    const { api, gets } = makeApi({});

    expect(await pollCloudRenders(api)).toEqual({
      checked: 0,
      finished: 0,
      failed: 0
    });
    expect(gets).toEqual([]);
  });

  it("downloads a finished render and reports it", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    const { api } = makeApi({
      get: (url) =>
        url.startsWith("/queue/")
          ? [queueItem("cloud-a", "FINISHED")]
          : { s3_url: "https://bucket.s3.amazonaws.com/out.mp4?sig=1" }
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome.finished).toBe(1);
    expect(bridge.finished).toEqual([
      { jobId: "job-1", url: "https://bucket.s3.amazonaws.com/out.mp4?sig=1" }
    ]);
  });

  it("retries a local download failure instead of failing the cloud render", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    bridge.api.cloud.renders.finish.mockRejectedValueOnce(
      new Error("temporary write failure")
    );
    const { api } = makeApi({
      get: (url) =>
        url.startsWith("/queue/")
          ? [queueItem("cloud-a", "FINISHED")]
          : { s3_url: "https://bucket.s3.amazonaws.com/out.mp4?sig=1" }
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome).toEqual({ checked: 1, finished: 0, failed: 0 });
    expect(bridge.failed).toEqual([]);
  });

  it("uses one queue request for several renders in a project", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INQUEUE"
      },
      {
        id: "job-2",
        cloudAssetId: "cloud-b",
        projectId: "p1",
        status: "INQUEUE"
      }
    ]);
    const { api, gets } = makeApi({
      get: () => [
        queueItem("cloud-a", "INPROGRESS"),
        queueItem("cloud-b", "INPROGRESS")
      ]
    });

    await pollCloudRenders(api);

    expect(gets.filter((url) => url.startsWith("/queue/"))).toHaveLength(1);
  });

  it("records a status change without touching the asset endpoint", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "PENDING"
      }
    ]);
    const { api, gets } = makeApi({
      get: () => [queueItem("cloud-a", "INPROGRESS")]
    });

    await pollCloudRenders(api);

    expect(bridge.statuses).toEqual([{ jobId: "job-1", status: "INPROGRESS" }]);
    expect(gets.some((url) => url.startsWith("/assets/"))).toBe(false);
  });

  it("does not rewrite a status that has not changed", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    const { api } = makeApi({
      get: () => [queueItem("cloud-a", "INPROGRESS")]
    });

    await pollCloudRenders(api);

    expect(bridge.statuses).toEqual([]);
  });

  it("records progress on every poll while the status stays the same", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS",
        progress: 12
      }
    ]);
    const { api } = makeApi({
      get: () => [{ ...queueItem("cloud-a", "INPROGRESS"), progress: 37.4 }]
    });

    await pollCloudRenders(api);

    expect(bridge.statuses).toEqual([
      { jobId: "job-1", status: "INPROGRESS", progress: 37 }
    ]);
  });

  it("does not rewrite progress that has not changed", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS",
        progress: 37
      }
    ]);
    const { api } = makeApi({
      get: () => [{ ...queueItem("cloud-a", "INPROGRESS"), progress: 37.2 }]
    });

    await pollCloudRenders(api);

    expect(bridge.statuses).toEqual([]);
  });

  it("fails a job the cloud reports as failed or cancelled", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      },
      {
        id: "job-2",
        cloudAssetId: "cloud-b",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    const { api } = makeApi({
      get: () => [
        queueItem("cloud-a", "FAILED"),
        queueItem("cloud-b", "CANCELLED")
      ]
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome.failed).toBe(2);
    expect(bridge.failed.map((entry) => entry.jobId).sort()).toEqual([
      "job-1",
      "job-2"
    ]);
    expect(bridge.failed.find((e) => e.jobId === "job-2")?.message).toMatch(
      /cancelled/
    );
  });

  it("reports the server's own failure reason when there is one", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    const { api } = makeApi({
      get: () => [
        { ...queueItem("cloud-a", "ERROR"), rejected_reason: "Out of credits" }
      ]
    });

    await pollCloudRenders(api);

    expect(bridge.failed[0]?.message).toBe("Out of credits");
  });

  it("names the queue item when the server recorded no reason", async () => {
    // Observed on staging: ERROR with an empty error object, so the only useful
    // thing to give the user is something to look the failure up by.
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    const { api } = makeApi({
      get: () => [{ ...queueItem("cloud-a", "ERROR"), error: {} }]
    });

    await pollCloudRenders(api);

    expect(bridge.failed[0]?.message).toContain("q-cloud-a");
  });

  it("waits rather than failing when a finished render has no URL yet", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    const { api } = makeApi({
      get: (url) =>
        url.startsWith("/queue/") ? [queueItem("cloud-a", "FINISHED")] : {}
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome.finished).toBe(0);
    expect(bridge.failed).toEqual([]);
    expect(bridge.finished).toEqual([]);
  });

  it("resumes a job the app quit on before it was ever polled", async () => {
    // Job rows outlive the window: a render submitted and then quit on is still
    // PENDING locally, and the next launch must pick it up rather than orphan it.
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "PENDING"
      }
    ]);
    const { api } = makeApi({
      get: (url) =>
        url.startsWith("/queue/")
          ? [queueItem("cloud-a", "FINISHED")]
          : { s3_url: "https://bucket.s3.amazonaws.com/out.mp4?sig=1" }
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome.finished).toBe(1);
    expect(bridge.finished[0]?.jobId).toBe("job-1");
  });

  it("survives a transient queue failure without failing the job", async () => {
    // A dropped connection must not destroy a render that is still running.
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    const { api } = makeApi({
      get: () => {
        throw new Error("network down");
      }
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome).toEqual({ checked: 1, finished: 0, failed: 0 });
    expect(bridge.failed).toEqual([]);
  });

  it("skips a project whose mirror link has gone", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "unknown",
        status: "INQUEUE"
      }
    ]);
    const { api, gets } = makeApi({ get: () => [] });

    const outcome = await pollCloudRenders(api);

    expect(outcome.checked).toBe(1);
    expect(gets).toEqual([]);
  });

  it("settles a job missing from the project queue from the unfiltered queue", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    const { api, gets } = makeApi({
      get: (url) => {
        if (url.startsWith("/queue/project/")) return [];
        if (url === "/queue/unfiltered")
          return [queueItem("cloud-a", "FINISHED")];
        return { s3_url: "https://bucket.s3.amazonaws.com/out.mp4?sig=1" };
      }
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome.finished).toBe(1);
    expect(gets).toContain("/queue/unfiltered");
  });

  it("asks the unfiltered queue once per poll however many jobs are missing", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INQUEUE"
      },
      {
        id: "job-2",
        cloudAssetId: "cloud-b",
        projectId: "p1",
        status: "INQUEUE"
      }
    ]);
    const { api, gets } = makeApi({
      get: (url) =>
        url === "/queue/unfiltered"
          ? [queueItem("cloud-a", "PAUSED"), queueItem("cloud-b", "PAUSED")]
          : []
    });

    await pollCloudRenders(api);

    expect(gets.filter((url) => url === "/queue/unfiltered")).toHaveLength(1);
  });

  it("downloads a render that left every queue but whose output exists", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    const { api } = makeApi({
      get: (url) =>
        url.startsWith("/queue/")
          ? []
          : { s3_url: "https://bucket.s3.amazonaws.com/out.mp4?sig=1" }
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome.finished).toBe(1);
    expect(bridge.finished[0]?.jobId).toBe("job-1");
  });

  it("marks a render cancelled when it left every queue without an output", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INQUEUE"
      }
    ]);
    const { api } = makeApi({
      get: (url) => (url.startsWith("/queue/") ? [] : { status: "pending" })
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome.failed).toBe(1);
    expect(bridge.failed[0]?.message).toMatch(/cancelled/);
  });

  it("fails a render whose asset is gone from the cloud", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INQUEUE"
      }
    ]);
    const { api } = makeApi({
      get: (url) => {
        if (url.startsWith("/queue/")) return [];
        throw Object.assign(new Error("HTTP 404"), {
          response: { status: 404, data: { error: "Asset not found" } }
        });
      }
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome.failed).toBe(1);
    expect(bridge.failed[0]?.message).toMatch(/no longer exists/);
  });

  it("leaves a missing job alone when the unfiltered queue cannot be read", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "PENDING"
      }
    ]);
    const { api, gets } = makeApi({
      get: (url) => {
        if (url === "/queue/unfiltered") throw new Error("network down");
        return [];
      }
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome).toEqual({ checked: 1, finished: 0, failed: 0 });
    expect(gets.some((url) => url.startsWith("/assets/"))).toBe(false);
  });

  it("fails a finished render whose output ingestion failed, with the backend reason", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    const { api } = makeApi({
      get: (url) => {
        if (url.startsWith("/queue/"))
          return [queueItem("cloud-a", "FINISHED")];
        throw Object.assign(new Error("HTTP 422"), {
          response: {
            status: 422,
            data: { error: { message: "video could not be decoded" } }
          }
        });
      }
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome.failed).toBe(1);
    expect(bridge.failed).toEqual([
      { jobId: "job-1", message: "video could not be decoded" }
    ]);
  });

  it("keeps waiting when the finished render's asset is briefly unreachable", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "INPROGRESS"
      }
    ]);
    const { api } = makeApi({
      get: (url) => {
        if (url.startsWith("/queue/"))
          return [queueItem("cloud-a", "FINISHED")];
        throw new Error("network down");
      }
    });

    const outcome = await pollCloudRenders(api);

    expect(outcome).toEqual({ checked: 1, finished: 0, failed: 0 });
  });

  it("shows a paused render as queued even though prod reports a start time", async () => {
    bridge.setJobs([
      {
        id: "job-1",
        cloudAssetId: "cloud-a",
        projectId: "p1",
        status: "PENDING"
      }
    ]);
    const { api } = makeApi({
      get: () => [queueItem("cloud-a", "PAUSED", true)]
    });

    await pollCloudRenders(api);

    expect(bridge.statuses).toEqual([{ jobId: "job-1", status: "INQUEUE" }]);
  });
});
