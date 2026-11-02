import type { CacheType, OPFSRequest, OPFSResponse } from "./opfsMessages";

const REQUEST_TIMEOUT_MS = 30000;
const ID_RADIX = 36;
const ID_START = 2;
const ID_END = 11;

let worker: Worker | null = null;
let workerInitPromise: Promise<Worker> | null = null;

const pendingRequests = new Map<
  string,
  { resolve: (response: OPFSResponse) => void; reject: (error: Error) => void }
>();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(ID_RADIX).substring(ID_START, ID_END)}`;
}

async function getWorker(): Promise<Worker> {
  if (worker) return worker;
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = new Promise((resolve, reject) => {
    try {
      const newWorker = new Worker(
        new URL("./opfsWorker.ts", import.meta.url),
        { type: "module" }
      );

      newWorker.onmessage = (event: MessageEvent<OPFSResponse>) => {
        const response = event.data;
        const pending = pendingRequests.get(response.id);
        if (pending) {
          pendingRequests.delete(response.id);
          pending.resolve(response);
        }
      };

      newWorker.onerror = (error) => {
        console.error("OPFS Worker error:", error);
        pendingRequests.forEach((pending) => {
          pending.reject(new Error("Worker error"));
        });
        pendingRequests.clear();
        worker = null;
        workerInitPromise = null;
      };

      worker = newWorker;
      resolve(newWorker);
    } catch (error) {
      workerInitPromise = null;
      reject(error);
    }
  });

  return workerInitPromise;
}

async function sendRequest(request: OPFSRequest): Promise<OPFSResponse> {
  const opfsWorker = await getWorker();

  return new Promise((resolve, reject) => {
    pendingRequests.set(request.id, { resolve, reject });

    const transferables: Transferable[] = [];
    if (request.data) {
      transferables.push(request.data);
    }

    opfsWorker.postMessage(request, transferables);

    setTimeout(() => {
      if (pendingRequests.has(request.id)) {
        pendingRequests.delete(request.id);
        reject(new Error("OPFS request timeout"));
      }
    }, REQUEST_TIMEOUT_MS);
  });
}

export async function opfsSet(
  cacheType: CacheType,
  key: string,
  blob: Blob
): Promise<void> {
  const data = await blob.arrayBuffer();
  const response = await sendRequest({
    id: generateId(),
    operation: "write",
    cacheType,
    key,
    data
  });

  if (!response.success) {
    throw new Error(response.error ?? "Failed to write to OPFS");
  }
}

export async function opfsGet(
  cacheType: CacheType,
  key: string
): Promise<Blob | undefined> {
  const response = await sendRequest({
    id: generateId(),
    operation: "read",
    cacheType,
    key
  });

  if (!response.success || !response.data) {
    return undefined;
  }

  const mimeType =
    cacheType === "video"
      ? "video/mp4"
      : cacheType === "filmstrip" || cacheType === "frame"
        ? "image/jpeg"
        : "image/png";

  return new Blob([response.data], { type: mimeType });
}

export async function opfsClear(cacheType?: CacheType): Promise<void> {
  const response = await sendRequest({
    id: generateId(),
    operation: "clear",
    cacheType: cacheType ?? ("__all__" as CacheType),
    key: undefined
  });

  if (!response.success) {
    throw new Error(response.error ?? "Failed to clear OPFS cache");
  }
}

export { isOPFSSupported } from "./featureDetection";
export type { CacheType } from "./opfsMessages";
