const COMFY_MANAGER_ROUTE_PREFIXES = ["/api/manager", "/manager"];
const COMFY_MANAGER_TIMEOUT_MS = 3_000;

const requestComfyManager = async (endpoint: string, route: string) => {
  for (const prefix of COMFY_MANAGER_ROUTE_PREFIXES) {
    const isAnswered = await fetch(`${endpoint}${prefix}${route}`, {
      signal: AbortSignal.timeout(COMFY_MANAGER_TIMEOUT_MS)
    })
      .then((response) => response.ok)
      .catch(() => false);
    if (isAnswered) return true;
  }
  return false;
};

export const isComfyManagerAvailable = (endpoint: string) =>
  requestComfyManager(endpoint, "/version");

export const rebootThroughComfyManager = (endpoint: string) =>
  requestComfyManager(endpoint, "/reboot");
