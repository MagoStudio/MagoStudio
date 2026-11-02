import type { ComfyLauncher } from "./ComfyLauncher";
import { rebootThroughComfyManager } from "./comfyManagerReboot";

export const restartComfy = async ({
  launcher,
  endpoint
}: {
  launcher: Pick<
    ComfyLauncher,
    | "isLaunchedProcessRunning"
    | "restartLaunchedProcess"
    | "relaunchProcessStartedOutsideMago"
    | "waitUntilEndpointStopsAnswering"
  >;
  endpoint: string;
}): Promise<void> => {
  if (launcher.isLaunchedProcessRunning())
    return launcher.restartLaunchedProcess();
  if (await rebootThroughComfyManager(endpoint)) {
    const hasComfyManagerStoppedComfy = await launcher
      .waitUntilEndpointStopsAnswering()
      .then(() => true)
      .catch(() => false);
    if (hasComfyManagerStoppedComfy) return;
  }
  await launcher.relaunchProcessStartedOutsideMago();
};
