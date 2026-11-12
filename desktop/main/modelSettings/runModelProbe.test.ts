import { expect, it, vi } from "vitest";

const run = vi.hoisted(() => vi.fn());
vi.mock("../localSetup/installNodePackRequirements", () => ({
  runPythonProcess: run
}));
import { runModelProbe } from "./runModelProbe";

it("cancels a running model probe with the installer signal", async () => {
  const controller = new AbortController();
  run.mockImplementation(
    (_python, _args, signal: AbortSignal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true
        });
      })
  );
  const probe = runModelProbe(
    "python",
    { action: "runtime" },
    60_000,
    controller.signal
  );
  controller.abort(new Error("paused"));
  await expect(probe).rejects.toThrow("paused");
  expect(run.mock.calls[0][2].aborted).toBe(true);
});

it("does not spawn a probe if the installer is already cancelled", async () => {
  run.mockClear();
  await expect(
    runModelProbe(
      "python",
      { action: "runtime" },
      60_000,
      AbortSignal.abort(new Error("paused"))
    )
  ).rejects.toThrow("paused");
  expect(run).not.toHaveBeenCalled();
});
