import { describe, expect, it, vi } from "vitest";

import { LocalShotMetrics } from "./localShotMetrics";

const setup = (initial: Record<string, unknown> | null = null) => {
  let stored = initial;
  let finish!: (result: Record<string, unknown>) => void;
  const evaluate = vi.fn(
    () =>
      new Promise<Record<string, unknown>>((resolve) => {
        finish = resolve;
      })
  );
  const dependencies = {
    read: vi.fn(async () => stored),
    write: vi.fn(async (_id: string, value: Record<string, unknown>) => {
      stored = value;
    }),
    resolveInput: vi.fn(async () => ({
      sourcePath: "shot.mp4",
      prompt: "walk",
      durationSeconds: 5,
      referencePaths: []
    })),
    evaluate
  };
  return {
    service: new LocalShotMetrics(dependencies),
    dependencies,
    finish: (value: Record<string, unknown>) => finish(value),
    stored: () => stored
  };
};

describe("local shot scoring lifecycle", () => {
  it("deduplicates concurrent readers, returns pending and persists completion", async () => {
    const test = setup();
    const [a, b] = await Promise.all([
      test.service.get("video"),
      test.service.get("video")
    ]);
    expect(a.status).toBe("PENDING");
    expect(b).toEqual(a);
    expect(test.dependencies.evaluate).toHaveBeenCalledTimes(1);
    test.finish({ vid_score: 8.5, vid_pass: true });
    await vi.waitFor(() => expect(test.stored()?.status).toBe("COMPLETED"));
    expect(await test.service.get("video")).toMatchObject({
      status: "COMPLETED",
      vid_score: 8.5
    });
    expect(test.dependencies.evaluate).toHaveBeenCalledTimes(1);
  });
  it("restarts interrupted jobs and reuses completed jobs after restart", async () => {
    const interrupted = setup({ status: "PENDING" });
    await interrupted.service.get("video");
    expect(interrupted.dependencies.evaluate).toHaveBeenCalledTimes(1);
    interrupted.finish({ vid_score: 6 });
    await vi.waitFor(() =>
      expect(interrupted.stored()?.status).toBe("COMPLETED")
    );
    const restarted = setup(interrupted.stored());
    expect(await restarted.service.get("video")).toMatchObject({
      status: "COMPLETED",
      vid_score: 6
    });
    expect(restarted.dependencies.evaluate).not.toHaveBeenCalled();
  });
  it("persists evaluation failures with no fabricated score", async () => {
    const test = setup();
    test.dependencies.evaluate.mockRejectedValue(new Error("VLM missing"));
    await test.service.get("video");
    await vi.waitFor(() => expect(test.stored()?.status).toBe("FAILED"));
    expect(await test.service.get("video")).toMatchObject({
      vid_score: null,
      error: { stage: "evaluate", message: "VLM missing" }
    });
  });
  it("does not leave a pending badge if saving the result fails", async () => {
    const test = setup();
    await test.service.get("video");
    test.dependencies.write.mockRejectedValue(new Error("disk full"));
    test.finish({ vid_score: 7 });
    await vi.waitFor(async () =>
      expect(await test.service.get("video")).toMatchObject({
        status: "FAILED",
        error: { stage: "persist" }
      })
    );
  });
});
