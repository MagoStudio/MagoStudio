import { COMFY_PROCESS_CLIENT_ID } from "./comfyClientId";
import {
  type ComfyWebSocket,
  ComfyProgressMonitor
} from "./ComfyProgressMonitor";
import { normalizeComfyEndpoint } from "./normalizeComfyEndpoint";

const monitorsByEndpoint = new Map<string, ComfyProgressMonitor>();
const promptSettledListeners = new Set<(promptId: string) => void>();

const createNativeWebSocket = (url: string): ComfyWebSocket =>
  new WebSocket(url);

export const comfyProgressMonitorFor = (
  endpoint: string
): ComfyProgressMonitor => {
  const normalizedEndpoint = normalizeComfyEndpoint(endpoint);
  const existingMonitor = monitorsByEndpoint.get(normalizedEndpoint);
  if (existingMonitor) return existingMonitor;
  const monitor = new ComfyProgressMonitor(
    normalizedEndpoint,
    COMFY_PROCESS_CLIENT_ID,
    createNativeWebSocket
  );
  monitor.onPromptSettled((promptId) => {
    for (const listener of promptSettledListeners) listener(promptId);
  });
  monitorsByEndpoint.set(normalizedEndpoint, monitor);
  return monitor;
};

export const onAnyComfyPromptSettled = (
  listener: (promptId: string) => void
): (() => void) => {
  promptSettledListeners.add(listener);
  return () => promptSettledListeners.delete(listener);
};

export const closeAllComfyProgressMonitors = (): void => {
  for (const monitor of monitorsByEndpoint.values()) monitor.close();
  monitorsByEndpoint.clear();
};
