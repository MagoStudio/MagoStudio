import { beforeEach, describe, expect, it, vi } from "vitest";

import { pollCloudImageRenders } from "./pollCloudImageRenders";

const makeBridge = () => {
  const finished: { jobId: string; url: string }[] = [];
  const failed: { jobId: string; message: string }[] = [];
  const statuses: { jobId: string; status: string; progress?: number }[] = [];
  let jobs: {
    id: string;
    cloudAssetId: string | null;
    cloudClipId: string | null;
    kind: "video" | "img2img";
    projectId: string;
    status: string;
    progress?: number;
  }[] = [];

  return {
    finished,
    failed,
    statuses,
    setJobs: (next: typeof jobs) => {
      jobs = next;
    },
    api: {
      cloud: {
        renders: {
          register: vi.fn(),
          registerImage: vi.fn(),
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

const IMAGE_JOB = {
  id: "job-1",
  cloudAssetId: "cloud-asset",
  cloudClipId: "cloud-clip",
  kind: "img2img" as const,
  projectId: "p1",
  status: "INPROGRESS"
};

describe("pollCloudImageRenders", () => {
  it("does nothing when no image job is in flight", async () => {
    const { api, gets } = makeApi({});

    expect(await pollCloudImageRenders(api)).toEqual({
      checked: 0,
      finished: 0,
      failed: 0
    });
    expect(gets).toEqual([]);
  });

  it("ignores a video job -- that is pollCloudRenders' work", async () => {
    bridge.setJobs([{ ...IMAGE_JOB, id: "video-job", kind: "video" }]);
    const { api, gets } = makeApi({});

    expect(await pollCloudImageRenders(api)).toEqual({
      checked: 0,
      finished: 0,
      failed: 0
    });
    expect(gets).toEqual([]);
  });

  it("polls by the cloud clip id, not the asset id", async () => {
    bridge.setJobs([IMAGE_JOB]);
    const { api, gets } = makeApi({
      get: () => ({ render_status: "running", progress: 0.4 })
    });

    await pollCloudImageRenders(api);

    expect(gets).toEqual(["/assets/img2img/status/cloud-clip"]);
  });

  it("downloads a finished render and reports it", async () => {
    bridge.setJobs([IMAGE_JOB]);
    const { api } = makeApi({
      get: () => ({
        render_status: "success",
        output_url: "https://bucket.s3.amazonaws.com/out.png?sig=1"
      })
    });

    const outcome = await pollCloudImageRenders(api);

    expect(outcome.finished).toBe(1);
    expect(bridge.finished).toEqual([
      { jobId: "job-1", url: "https://bucket.s3.amazonaws.com/out.png?sig=1" }
    ]);
  });

  it("retries a local download failure instead of failing the cloud render", async () => {
    bridge.setJobs([IMAGE_JOB]);
    bridge.api.cloud.renders.finish.mockRejectedValueOnce(
      new Error("temporary write failure")
    );
    const { api } = makeApi({
      get: () => ({
        render_status: "success",
        output_url: "https://bucket.s3.amazonaws.com/out.png?sig=1"
      })
    });

    const outcome = await pollCloudImageRenders(api);

    expect(outcome).toEqual({ checked: 1, finished: 0, failed: 0 });
    expect(bridge.failed).toEqual([]);
  });

  it("waits for the URL rather than finishing without one", async () => {
    bridge.setJobs([IMAGE_JOB]);
    const { api } = makeApi({
      get: () => ({ render_status: "success" })
    });

    const outcome = await pollCloudImageRenders(api);

    expect(outcome.finished).toBe(0);
    expect(bridge.finished).toEqual([]);
  });

  it("records a failure and moves on", async () => {
    bridge.setJobs([IMAGE_JOB]);
    const { api } = makeApi({
      get: () => ({ render_status: "failed" })
    });

    const outcome = await pollCloudImageRenders(api);

    expect(outcome.failed).toBe(1);
    expect(bridge.failed).toEqual([
      { jobId: "job-1", message: "The cloud render failed" }
    ]);
  });

  it("records the backend's reason for a failed render", async () => {
    bridge.setJobs([IMAGE_JOB]);
    const { api } = makeApi({
      get: () => ({
        render_status: "failed",
        error_message: "Content policy violation"
      })
    });

    await pollCloudImageRenders(api);

    expect(bridge.failed).toEqual([
      { jobId: "job-1", message: "Content policy violation" }
    ]);
  });

  it("records a cancellation distinctly from a failure", async () => {
    bridge.setJobs([IMAGE_JOB]);
    const { api } = makeApi({
      get: () => ({ render_status: "cancelled" })
    });

    await pollCloudImageRenders(api);

    expect(bridge.failed).toEqual([
      { jobId: "job-1", message: "The cloud render was cancelled" }
    ]);
  });

  it("records the transition from queued to running, with progress as a percentage", async () => {
    bridge.setJobs([{ ...IMAGE_JOB, status: "INQUEUE" }]);
    const { api } = makeApi({
      get: () => ({ render_status: "running", progress: 0.55 })
    });

    await pollCloudImageRenders(api);

    expect(bridge.statuses).toEqual([
      { jobId: "job-1", status: "INPROGRESS", progress: 55 }
    ]);
    expect(bridge.finished).toEqual([]);
    expect(bridge.failed).toEqual([]);
  });

  it("records progress on every poll while the render keeps running", async () => {
    bridge.setJobs([{ ...IMAGE_JOB, status: "INPROGRESS", progress: 20 }]);
    const { api } = makeApi({
      get: () => ({ render_status: "running", progress: 0.55 })
    });

    await pollCloudImageRenders(api);

    expect(bridge.statuses).toEqual([
      { jobId: "job-1", status: "INPROGRESS", progress: 55 }
    ]);
  });

  it("does not rewrite progress that has not changed", async () => {
    bridge.setJobs([{ ...IMAGE_JOB, status: "INPROGRESS", progress: 55 }]);
    const { api } = makeApi({
      get: () => ({ render_status: "running", progress: 0.55 })
    });

    await pollCloudImageRenders(api);

    expect(bridge.statuses).toEqual([]);
  });

  it("skips a job with no cloud clip id rather than polling nothing", async () => {
    bridge.setJobs([{ ...IMAGE_JOB, cloudClipId: null }]);
    const { api, gets } = makeApi({});

    const outcome = await pollCloudImageRenders(api);

    expect(gets).toEqual([]);
    expect(outcome.finished).toBe(0);
    expect(outcome.failed).toBe(0);
  });

  it("does not fail a job on a transient network error", async () => {
    bridge.setJobs([IMAGE_JOB]);
    const api = {
      post: vi.fn(),
      get: vi.fn(async () => {
        throw new Error("network down");
      })
    };

    const outcome = await pollCloudImageRenders(api);

    expect(outcome.failed).toBe(0);
    expect(bridge.failed).toEqual([]);
  });

  it("fails a job on every terminal failure status prod reports", async () => {
    for (const renderStatus of ["error", "not_found", "TIMEOUT"]) {
      bridge = makeBridge();
      bridge.setJobs([IMAGE_JOB]);
      const { api } = makeApi({ get: () => ({ render_status: renderStatus }) });

      const outcome = await pollCloudImageRenders(api);

      expect(outcome.failed).toBe(1);
    }
  });

  it("fails a job whose clip the cloud no longer has", async () => {
    bridge.setJobs([IMAGE_JOB]);
    const api = {
      post: vi.fn(),
      get: vi.fn(async () => {
        throw Object.assign(new Error("HTTP 404"), {
          response: { status: 404, data: { error: "Clip not found" } }
        });
      })
    };

    const outcome = await pollCloudImageRenders(api);

    expect(outcome.failed).toBe(1);
    expect(bridge.failed).toEqual([
      { jobId: "job-1", message: "Clip not found" }
    ]);
  });

  it("keeps polling through a server error on the status endpoint", async () => {
    bridge.setJobs([IMAGE_JOB]);
    const api = {
      post: vi.fn(),
      get: vi.fn(async () => {
        throw Object.assign(new Error("HTTP 500"), {
          response: {
            status: 500,
            data: { error: "Failed to get render status" }
          }
        });
      })
    };

    const outcome = await pollCloudImageRenders(api);

    expect(outcome.failed).toBe(0);
  });
});
