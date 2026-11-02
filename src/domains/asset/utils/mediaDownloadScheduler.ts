type Kind = "video" | "image";
export const DOWNLOAD_PRIORITY = {
  background: 0,
  project: 1,
  shot: 2,
  visible: 3,
  playback: 4
} as const;
const IMAGE_DOWNLOAD_CONCURRENCY = 4;
export type DownloadState = "queued" | "downloading" | "ready" | "failed";
type Context = { projectId?: string; timelineId?: string };
type Request<T> = Context & {
  key: string;
  assetId: string;
  kind: Kind;
  run: (signal: AbortSignal) => Promise<T>;
  signal?: AbortSignal;
};
type Job = Request<unknown> & {
  order: number;
  controller?: AbortController;
  promise: Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

/** Shared by disk mirroring and browser preview caches. Navigation changes
 * priority, not ownership: old projects continue when foreground work is idle. */
export class MediaDownloadScheduler {
  private jobs = new Map<string, Job>();
  private contexts = new Map<string, Context>();
  private demands = new Map<string, Map<symbol, number>>();
  private states = new Map<string, DownloadState>();
  private stateAssetIds = new Map<string, string>();
  private assetStates = new Map<string, DownloadState>();
  private failures = new Map<string, Request<unknown>>();
  private listeners = new Set<() => void>();
  private projectId?: string;
  private timelineId?: string;
  private order = 0;
  private pumping = false;
  private workScheduled = false;
  private publicationScheduled = false;
  private snapshot = { queued: 0, downloading: 0, ready: 0, failed: 0 };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = () => this.snapshot;
  getAssetState = (assetId: string): DownloadState | undefined => {
    return this.assetStates.get(assetId);
  };
  registerAsset(assetId: string, context: Context): void {
    this.contexts.set(assetId, context);
  }
  setForeground(projectId?: string, timelineId?: string): void {
    this.projectId = projectId;
    this.timelineId = timelineId;
    this.schedulePump();
  }
  setTimeline(timelineId?: string): void {
    this.timelineId = timelineId;
    this.schedulePump();
  }
  demand(
    assetId: string,
    priority: number = DOWNLOAD_PRIORITY.visible
  ): () => void {
    const token = Symbol();
    const leases = this.demands.get(assetId) ?? new Map<symbol, number>();
    leases.set(token, priority);
    this.demands.set(assetId, leases);
    this.schedulePump();
    return () => {
      leases.delete(token);
      if (!leases.size) this.demands.delete(assetId);
      this.schedulePump();
    };
  }
  private priority(job: Job): number {
    const context = this.contexts.get(job.assetId) ?? job;
    const demand = Math.max(
      0,
      ...(this.demands.get(job.assetId)?.values() ?? [])
    );
    if (demand) return demand;
    if (context.projectId && context.projectId === this.projectId) {
      return context.timelineId && context.timelineId === this.timelineId
        ? 2
        : 1;
    }
    return 0;
  }
  enqueue<T>(request: Request<T>): Promise<T> {
    const existing = this.jobs.get(request.key);
    if (existing) return existing.promise as Promise<T>;
    if (request.signal?.aborted)
      return Promise.reject(new DOMException("Cancelled", "AbortError"));
    let resolve!: (value: unknown) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<unknown>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    const job: Job = {
      ...request,
      controller: undefined,
      order: this.order++,
      promise,
      resolve,
      reject
    };
    this.jobs.set(job.key, job);
    this.failures.delete(job.key);
    this.states.set(job.key, "queued");
    this.stateAssetIds.set(job.key, job.assetId);
    const cancel = () => {
      if (job.controller) job.controller.abort();
      else {
        this.jobs.delete(job.key);
        this.states.delete(job.key);
        reject(new DOMException("Cancelled", "AbortError"));
        this.publish();
        this.schedulePump();
      }
    };
    request.signal?.addEventListener("abort", cancel, { once: true });
    void promise
      .finally(() => request.signal?.removeEventListener("abort", cancel))
      .catch(() => {});
    this.publish();
    // Let a burst of enqueues and React visibility effects settle before choosing.
    this.schedulePump();
    return promise as Promise<T>;
  }
  async retryAsset(assetId: string): Promise<void> {
    const requests = [...this.failures.values()].filter(
      (request) => request.assetId === assetId
    );
    await Promise.all(
      requests.map((request) => this.enqueue({ ...request, signal: undefined }))
    );
  }
  private publish(): void {
    if (this.publicationScheduled) return;
    this.publicationScheduled = true;
    queueMicrotask(() => {
      this.publicationScheduled = false;
      this.publishNow();
    });
  }
  private schedulePump(): void {
    if (this.workScheduled) return;
    this.workScheduled = true;
    queueMicrotask(() => {
      this.workScheduled = false;
      this.pump();
    });
  }
  private publishNow(): void {
    const counts = { queued: 0, downloading: 0, ready: 0, failed: 0 };
    this.assetStates.clear();
    const rank = { ready: 0, failed: 1, queued: 2, downloading: 3 };
    this.states.forEach((state, key) => {
      counts[state] += 1;
      const assetId = this.stateAssetIds.get(key)!;
      const previous = this.assetStates.get(assetId);
      if (!previous || rank[state] > rank[previous])
        this.assetStates.set(assetId, state);
    });
    this.snapshot = counts;
    this.listeners.forEach((listener) => listener());
  }
  private pump(): void {
    if (this.pumping) return;
    this.pumping = true;
    try {
      for (const kind of ["video", "image"] as const) {
        const running = [...this.jobs.values()].filter(
          (job) => job.kind === kind && job.controller
        );
        const pending = [...this.jobs.values()]
          .filter((job) => job.kind === kind && !job.controller)
          .sort(
            (a, b) => this.priority(b) - this.priority(a) || a.order - b.order
          );
        // Interrupt only an actual priority inversion. Equal-priority scrolling
        // never repeatedly restarts an otherwise useful transfer.
        if (
          kind === "video" &&
          running[0] &&
          pending[0] &&
          this.priority(pending[0]) > this.priority(running[0])
        ) {
          running[0].controller!.abort();
        }
        const slots =
          (kind === "video" ? 1 : IMAGE_DOWNLOAD_CONCURRENCY) - running.length;
        pending.slice(0, Math.max(0, slots)).forEach((job) => this.start(job));
      }
    } finally {
      this.pumping = false;
    }
  }
  private start(job: Job): void {
    const controller = new AbortController();
    job.controller = controller;
    this.states.set(job.key, "downloading");
    this.publish();
    void Promise.resolve()
      .then(() => job.run(controller.signal))
      .then((value) => {
        if (controller.signal.aborted)
          throw new DOMException("Interrupted", "AbortError");
        this.jobs.delete(job.key);
        this.states.set(job.key, "ready");
        job.resolve(value);
      })
      .catch((error) => {
        if (controller.signal.aborted && !job.signal?.aborted) {
          // IPC cancellation is awaited by run(), so the video slot is only
          // released once its old transfer has actually stopped.
          job.controller = undefined;
          this.states.set(job.key, "queued");
        } else {
          this.jobs.delete(job.key);
          if (job.signal?.aborted) this.states.delete(job.key);
          else {
            this.states.set(job.key, "failed");
            this.failures.set(job.key, job);
          }
          job.reject(error);
        }
      })
      .finally(() => {
        this.publish();
        this.schedulePump();
      });
  }
}

export const mediaDownloads = new MediaDownloadScheduler();
