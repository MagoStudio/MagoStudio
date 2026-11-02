import { afterEach, describe, expect, it, vi } from "vitest";

import { restartComfy } from "./restartComfy";

const endpoint = "http://127.0.0.1:8188";
const launcherWith = (isLaunchedByMago: boolean) => ({
  isLaunchedProcessRunning: () => isLaunchedByMago,
  restartLaunchedProcess: vi.fn(async () => {}),
  relaunchProcessStartedOutsideMago: vi.fn(async () => {}),
  waitUntilEndpointStopsAnswering: vi.fn(async () => {})
});
const stubComfyManagerReboot = (isRebootAccepted: boolean) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () => new Response("", { status: isRebootAccepted ? 200 : 403 })
    )
  );

describe("restartComfy", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("restarts the process Mago launched", async () => {
    stubComfyManagerReboot(true);
    const launcher = launcherWith(true);

    await restartComfy({ launcher, endpoint });

    expect(launcher.restartLaunchedProcess).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("asks ComfyUI-Manager to reboot a ComfyUI started outside Mago", async () => {
    stubComfyManagerReboot(true);
    const launcher = launcherWith(false);

    await restartComfy({ launcher, endpoint });

    expect(launcher.relaunchProcessStartedOutsideMago).not.toHaveBeenCalled();
  });

  it("relaunches from the install folder when ComfyUI-Manager accepts but ComfyUI keeps answering", async () => {
    stubComfyManagerReboot(true);
    const launcher = launcherWith(false);
    launcher.waitUntilEndpointStopsAnswering.mockRejectedValue(
      new Error("still answering")
    );

    await restartComfy({ launcher, endpoint });

    expect(launcher.relaunchProcessStartedOutsideMago).toHaveBeenCalledTimes(1);
  });

  it("relaunches from the install folder when ComfyUI-Manager refuses", async () => {
    stubComfyManagerReboot(false);
    const launcher = launcherWith(false);

    await restartComfy({ launcher, endpoint });

    expect(launcher.relaunchProcessStartedOutsideMago).toHaveBeenCalledTimes(1);
  });
});
