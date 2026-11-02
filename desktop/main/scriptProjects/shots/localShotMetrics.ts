import { runBackgroundTask } from "../../libraryHealth";
import type { ShotVideoEvaluationInput } from "../../vlm/videoMetrics";

type Metrics = Record<string, unknown>;
type Dependencies = {
  resolveInput: (assetId: string) => Promise<ShotVideoEvaluationInput>;
  read: (assetId: string) => Promise<Metrics | null>;
  write: (assetId: string, metrics: Metrics) => Promise<void>;
  evaluate: (input: ShotVideoEvaluationInput) => Promise<Metrics>;
};

const base = () => ({
  version: "v1",
  eval_mode: "image_to_video",
  score: null,
  vid_score: null,
  vid_pass: null,
  vid_issues: [],
  vid_next_prompt: null
});

/** Persisted per-video jobs. Opening an older version starts its first evaluation. */
export class LocalShotMetrics {
  private readonly requests = new Map<string, Promise<Metrics>>();
  private readonly running = new Map<string, Metrics>();

  constructor(private readonly dependencies: Dependencies) {}

  get(assetId: string): Promise<Metrics> {
    const active = this.running.get(assetId);
    if (active) return Promise.resolve(active);
    const existing = this.requests.get(assetId);
    if (existing) return existing;
    const request = this.readOrStart(assetId).finally(() =>
      this.requests.delete(assetId)
    );
    this.requests.set(assetId, request);
    return request;
  }

  private async readOrStart(assetId: string): Promise<Metrics> {
    const stored = await this.dependencies.read(assetId);
    if (stored?.status === "COMPLETED" || stored?.status === "FAILED")
      return stored;
    // A persisted PENDING without an in-process job was interrupted by restart.
    // Re-run it using its immutable render inputs rather than poll forever.
    const pending = {
      ...base(),
      status: "PENDING",
      started_at: new Date().toISOString()
    };
    await this.dependencies.write(assetId, pending);
    this.running.set(assetId, pending);
    void runBackgroundTask(`Shot metrics ${assetId}`, () =>
      this.evaluate(assetId, pending)
    );
    return pending;
  }

  private async evaluate(assetId: string, pending: Metrics): Promise<void> {
    let stage = "input";
    let result: Metrics;
    try {
      const input = await this.dependencies.resolveInput(assetId);
      stage = "evaluate";
      result = {
        ...pending,
        ...(await this.dependencies.evaluate(input)),
        status: "COMPLETED",
        error: null
      };
    } catch (error) {
      result = {
        ...pending,
        status: "FAILED",
        error: {
          stage,
          message: error instanceof Error ? error.message : String(error)
        }
      };
    }
    result.finished_at = new Date().toISOString();
    try {
      await this.dependencies.write(assetId, result);
      this.running.delete(assetId);
    } catch (error) {
      // Stop pollers even if a library disk disappears during evaluation.
      this.running.set(assetId, {
        ...pending,
        status: "FAILED",
        error: {
          stage: "persist",
          message: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }
}
