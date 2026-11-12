import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, openAsBlob } from "node:fs";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

import {
  formatComfyError,
  formatComfyHttpError
} from "../imageRenders/comfyError";
import {
  observeModelHost,
  prepareModelGraph,
  recordModelFailure
} from "../modelSettings/modelRuntimeHooks";
import { atomicProduceFile } from "../storage/atomicFile";

import { asRecord } from "./asRecord";
import { COMFY_PROCESS_CLIENT_ID } from "./comfyClientId";
import type { ComfyFileReference } from "./comfyFileReference";
import type { ComfyGraph } from "./comfyGraph";
import { comfyMimeTypeForFile } from "./comfyMimeTypeForFile";
import type { ComfyProgressMonitor } from "./ComfyProgressMonitor";
import { comfyProgressMonitorFor } from "./comfyProgressMonitors";
import { normalizeComfyEndpoint } from "./normalizeComfyEndpoint";
import { promptQueueContains } from "./promptQueueContains";
import { readComfyPromptWithSafetyPoll } from "./readComfyPromptWithSafetyPoll";

const REQUEST_TIMEOUT_MS = 30_000;
const DOWNLOAD_TIMEOUT_MS = 300_000;
const UPLOAD_SUBFOLDER = "mago";
const CONTENT_HASH_NAME_LENGTH = 32;
const submittedModelGraphs = new Map<string, ComfyGraph>();
const MAX_RECORDED_PROMPTS = 128;

export const COMFY_LOST_PROMPT_MESSAGE =
  "ComfyUI no longer has this render. ComfyUI may have restarted; start the render again.";

export type ComfyPromptStatus =
  | { state: "queued" | "running" }
  | { state: "finished"; outputs: Record<string, unknown> }
  | { state: "error"; message: string };

export type ComfyPromptWaitResult =
  | { kind: "finished"; outputs: Record<string, unknown> }
  | { kind: "cancelled" }
  | { kind: "timedOut" };

type ComfyPromptMonitor = Pick<
  ComfyProgressMonitor,
  "watch" | "forget" | "livePrompt" | "waitForSettle" | "resetConnection"
>;

const hashFile = async (filePath: string): Promise<string> => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
};

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export class ComfyClient {
  readonly endpoint: string;
  private readonly monitor: ComfyPromptMonitor;

  constructor(endpoint: string, monitor?: ComfyPromptMonitor) {
    this.endpoint = normalizeComfyEndpoint(endpoint);
    this.monitor = monitor ?? comfyProgressMonitorFor(this.endpoint);
  }

  async checkAvailable(): Promise<void> {
    await this.getJson("/system_stats");
  }

  async getJson(pathname: string): Promise<Record<string, unknown>> {
    const result = await this.json(pathname, { method: "GET" });
    if (pathname === "/system_stats")
      await observeModelHost(this.endpoint, result);
    return result;
  }

  async submitGraph(graph: ComfyGraph): Promise<string> {
    const preparedGraph = await prepareModelGraph(this.endpoint, graph);
    let response: Record<string, unknown>;
    try {
      response = await this.json("/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: preparedGraph,
          client_id: COMFY_PROCESS_CLIENT_ID
        })
      });
    } catch (error) {
      await recordModelFailure(
        this.endpoint,
        error instanceof Error ? error.message : String(error),
        preparedGraph
      );
      throw error;
    }
    if (typeof response.prompt_id !== "string" || !response.prompt_id) {
      const message = formatComfyError(response);
      await recordModelFailure(this.endpoint, message, preparedGraph);
      throw new Error(message);
    }
    this.monitor.watch(response.prompt_id, preparedGraph);
    submittedModelGraphs.set(
      `${this.endpoint}:${response.prompt_id}`,
      preparedGraph
    );
    if (submittedModelGraphs.size > MAX_RECORDED_PROMPTS)
      submittedModelGraphs.delete(submittedModelGraphs.keys().next().value!);
    return response.prompt_id;
  }

  async uploadFile(filePath: string): Promise<string> {
    const extension = path.extname(filePath).toLowerCase() || ".png";
    const contentHash = await hashFile(filePath);
    const body = await openAsBlob(filePath, {
      type: comfyMimeTypeForFile(filePath)
    });
    return this.upload(
      body,
      `${contentHash.slice(0, CONTENT_HASH_NAME_LENGTH)}${extension}`
    );
  }

  async uploadBytes(
    bytes: Buffer,
    mime: string,
    extension: string
  ): Promise<string> {
    const contentHash = createHash("sha256").update(bytes).digest("hex");
    return this.upload(
      new Blob([new Uint8Array(bytes)], { type: mime }),
      `${contentHash.slice(0, CONTENT_HASH_NAME_LENGTH)}${extension}`
    );
  }

  async readPromptStatus(promptId: string): Promise<ComfyPromptStatus> {
    const status = await this.readPromptStatusOverHttp(promptId);
    const isPromptOver =
      status.state === "finished" || status.state === "error";
    if (isPromptOver) this.monitor.forget(promptId);
    const key = `${this.endpoint}:${promptId}`,
      graph = submittedModelGraphs.get(key);
    if (status.state === "error" && graph)
      await recordModelFailure(this.endpoint, status.message, graph);
    if (isPromptOver) submittedModelGraphs.delete(key);
    return status;
  }

  private async readPromptStatusOverHttp(
    promptId: string
  ): Promise<ComfyPromptStatus> {
    const historyEntry = await this.readHistoryEntry(promptId);
    if (historyEntry) return this.statusFromHistory(historyEntry);
    const queue = await this.getJson("/queue");
    if (promptQueueContains(queue.queue_running, promptId))
      return { state: "running" };
    if (promptQueueContains(queue.queue_pending, promptId))
      return { state: "queued" };
    const lateHistoryEntry = await this.readHistoryEntry(promptId);
    if (lateHistoryEntry) return this.statusFromHistory(lateHistoryEntry);
    return { state: "error", message: COMFY_LOST_PROMPT_MESSAGE };
  }

  async downloadBuffer(
    reference: ComfyFileReference,
    { maxBytes, defaultType }: { maxBytes: number; defaultType: string }
  ): Promise<Buffer> {
    const response = await this.requestView(reference, defaultType);
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > maxBytes)
      throw new Error("ComfyUI output is too large");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > maxBytes)
      throw new Error("ComfyUI returned an invalid output");
    return bytes;
  }

  async downloadToFile(
    reference: ComfyFileReference,
    destinationPath: string,
    { maxBytes, defaultType }: { maxBytes: number; defaultType: string }
  ): Promise<void> {
    const response = await this.requestView(reference, defaultType);
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > maxBytes)
      throw new Error("ComfyUI output is too large");
    if (!response.body) throw new Error("ComfyUI returned an invalid output");
    let receivedBytes = 0;
    const enforceSizeLimit = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        receivedBytes += chunk.length;
        if (receivedBytes > maxBytes)
          callback(new Error("ComfyUI output is too large"));
        else callback(null, chunk);
      }
    });
    await atomicProduceFile(destinationPath, async (temporary) => {
      await pipeline(
        Readable.fromWeb(response.body as NodeReadableStream<Uint8Array>),
        enforceSizeLimit,
        createWriteStream(temporary)
      );
      if (receivedBytes === 0)
        throw new Error("ComfyUI returned an invalid output");
    });
  }

  async cancel(promptId: string): Promise<void> {
    const queue = await this.getJson("/queue");
    if (promptQueueContains(queue.queue_pending, promptId)) {
      await this.deleteFromQueue(promptId);
    } else if (promptQueueContains(queue.queue_running, promptId)) {
      await this.json("/interrupt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_id: promptId })
      });
    }
    this.monitor.forget(promptId);
  }

  async removeFromQueueIfPending(promptId: string): Promise<void> {
    const queue = await this.getJson("/queue");
    if (promptQueueContains(queue.queue_pending, promptId))
      await this.deleteFromQueue(promptId);
    this.monitor.forget(promptId);
  }

  forgetPrompt(promptId: string): void {
    this.monitor.forget(promptId);
  }

  async waitForPrompt(
    promptId: string,
    {
      timeoutMs,
      pollIntervalMs,
      isCancelled
    }: {
      timeoutMs: number;
      pollIntervalMs: number;
      isCancelled?: () => boolean;
    }
  ): Promise<ComfyPromptWaitResult> {
    const deadline = Date.now() + timeoutMs;
    let lastStatusCheckAt = Number.NEGATIVE_INFINITY;
    for (;;) {
      if (isCancelled?.()) return { kind: "cancelled" };
      const { result, statusCheckedAt } = await readComfyPromptWithSafetyPoll({
        monitor: this.monitor,
        promptId,
        lastStatusCheckAt,
        readOverHttp: () => this.readPromptStatus(promptId)
      });
      lastStatusCheckAt = statusCheckedAt ?? lastStatusCheckAt;
      if (result.state === "error") throw new Error(result.message);
      if (result.state === "finished")
        return { kind: "finished", outputs: result.outputs };
      if (Date.now() > deadline) return { kind: "timedOut" };
      if (this.monitor.livePrompt(promptId))
        await this.monitor.waitForSettle(promptId, pollIntervalMs);
      else await sleep(pollIntervalMs);
    }
  }

  private statusFromHistory(entry: Record<string, unknown>): ComfyPromptStatus {
    const status = asRecord(entry.status);
    if (status?.status_str === "error")
      return {
        state: "error",
        message: formatComfyError(status.messages ?? status)
      };
    const outputs = asRecord(entry.outputs) ?? {};
    const hasOutputs = Object.keys(outputs).length > 0;
    const isComplete =
      status?.completed === true ||
      status?.status_str === "success" ||
      (!status && hasOutputs);
    return isComplete ? { state: "finished", outputs } : { state: "running" };
  }

  private async readHistoryEntry(
    promptId: string
  ): Promise<Record<string, unknown> | null> {
    const history = await this.getJson(
      `/history/${encodeURIComponent(promptId)}`
    );
    return asRecord(history[promptId]);
  }

  private async upload(body: Blob, filename: string): Promise<string> {
    const form = new FormData();
    form.append("image", body, filename);
    form.append("type", "input");
    form.append("subfolder", UPLOAD_SUBFOLDER);
    form.append("overwrite", "true");
    const response = await this.json("/upload/image", {
      method: "POST",
      body: form
    });
    const name = typeof response.name === "string" ? response.name : filename;
    const subfolder =
      typeof response.subfolder === "string"
        ? response.subfolder
        : UPLOAD_SUBFOLDER;
    return subfolder ? `${subfolder}/${name}` : name;
  }

  private async deleteFromQueue(promptId: string): Promise<void> {
    await this.json("/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delete: [promptId] })
    });
  }

  private requestView(
    reference: ComfyFileReference,
    defaultType: string
  ): Promise<Response> {
    const query = new URLSearchParams({
      filename: reference.filename,
      subfolder: reference.subfolder ?? "",
      type: reference.type ?? defaultType
    });
    return this.request(`/view?${query}`, {
      method: "GET",
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS)
    });
  }

  private async json(
    pathname: string,
    init: RequestInit
  ): Promise<Record<string, unknown>> {
    const response = await this.request(pathname, init);
    try {
      return (await response.json()) as Record<string, unknown>;
    } catch {
      throw new Error(`ComfyUI returned invalid JSON for ${pathname}`);
    }
  }

  async request(pathname: string, init: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(`${this.endpoint}${pathname}`, {
        ...init,
        signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
    } catch (error) {
      throw new Error(
        `Cannot reach ComfyUI at ${this.endpoint}: ${error instanceof Error ? error.message : "network error"}`
      );
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        formatComfyHttpError(response.status, response.statusText, body)
      );
    }
    return response;
  }
}
