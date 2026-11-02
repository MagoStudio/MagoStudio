import type {
  ComfyRestartMethod,
  ComfyRestartStatus
} from "../../shared/contracts";

import { ComfyClient } from "./ComfyClient";
import type { ComfyLauncher } from "./ComfyLauncher";
import { isComfyManagerAvailable } from "./comfyManagerReboot";

const countQueueEntries = (entries: unknown) =>
  Array.isArray(entries) ? entries.length : 0;

const resolveComfyRestartMethod = async ({
  launcher,
  endpoint
}: {
  launcher: Pick<ComfyLauncher, "isLaunchedProcessRunning" | "canLaunch">;
  endpoint: string;
}): Promise<ComfyRestartMethod | null> => {
  if (launcher.isLaunchedProcessRunning()) return "mago-launched-process";
  if (!(await launcher.canLaunch())) return null;
  if (await isComfyManagerAvailable(endpoint)) return "comfyui-manager";
  return "relaunch-from-install-folder";
};

export const readComfyRestartStatus = async ({
  launcher,
  endpoint
}: {
  launcher: Pick<ComfyLauncher, "isLaunchedProcessRunning" | "canLaunch">;
  endpoint: string;
}): Promise<ComfyRestartStatus> => {
  const runningOrQueuedRenderCount = await new ComfyClient(endpoint)
    .getJson("/queue")
    .then(
      (queue) =>
        countQueueEntries(queue.queue_running) +
        countQueueEntries(queue.queue_pending)
    )
    .catch(() => null);
  return {
    restartMethod: await resolveComfyRestartMethod({ launcher, endpoint }),
    runningOrQueuedRenderCount
  };
};
