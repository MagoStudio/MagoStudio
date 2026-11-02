import { afterEach, describe, expect, it, vi } from "vitest";

import { readComfyRestartStatus } from "./readComfyRestartStatus";

const endpoint = "http://127.0.0.1:8188";
const launcherWith = ({
  isLaunchedByMago,
  canLaunch
}: {
  isLaunchedByMago: boolean;
  canLaunch: boolean;
}) => ({
  isLaunchedProcessRunning: () => isLaunchedByMago,
  canLaunch: async () => canLaunch
});
const stubComfy = ({ hasComfyManager }: { hasComfyManager: boolean }) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("/queue"))
        return Response.json({
          queue_running: [[0, "running-prompt"]],
          queue_pending: [
            [1, "queued-prompt"],
            [2, "queued-prompt-2"]
          ]
        });
      if (url.includes("/manager/") && hasComfyManager)
        return new Response("3.0");
      return new Response("missing", { status: 404 });
    })
  );

describe("readComfyRestartStatus", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("counts the renders ComfyUI is running and has queued", async () => {
    stubComfy({ hasComfyManager: false });

    await expect(
      readComfyRestartStatus({
        launcher: launcherWith({ isLaunchedByMago: true, canLaunch: true }),
        endpoint
      })
    ).resolves.toEqual({
      restartMethod: "mago-launched-process",
      runningOrQueuedRenderCount: 3
    });
  });

  it("restarts a ComfyUI started outside Mago through ComfyUI-Manager when it has one", async () => {
    stubComfy({ hasComfyManager: true });

    const status = await readComfyRestartStatus({
      launcher: launcherWith({ isLaunchedByMago: false, canLaunch: true }),
      endpoint
    });

    expect(status.restartMethod).toBe("comfyui-manager");
  });

  it("relaunches from the install folder when there is no ComfyUI-Manager", async () => {
    stubComfy({ hasComfyManager: false });

    const status = await readComfyRestartStatus({
      launcher: launcherWith({ isLaunchedByMago: false, canLaunch: true }),
      endpoint
    });

    expect(status.restartMethod).toBe("relaunch-from-install-folder");
  });

  it("offers no restart through ComfyUI-Manager alone when there is no install folder to fall back on", async () => {
    stubComfy({ hasComfyManager: true });

    const status = await readComfyRestartStatus({
      launcher: launcherWith({ isLaunchedByMago: false, canLaunch: false }),
      endpoint
    });

    expect(status.restartMethod).toBeNull();
  });

  it("offers no restart when Mago knows no way to restart this ComfyUI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      })
    );

    await expect(
      readComfyRestartStatus({
        launcher: launcherWith({ isLaunchedByMago: false, canLaunch: false }),
        endpoint
      })
    ).resolves.toEqual({
      restartMethod: null,
      runningOrQueuedRenderCount: null
    });
  });
});
