import { asRecord } from "./asRecord";
import type { ComfyGraph } from "./comfyGraph";
import { comfyGraphProgressFraction } from "./comfyGraphProgressFraction";
import { comfyGraphProgressWeights } from "./comfyGraphProgressWeights";
import { comfyWebSocketUrl } from "./comfyWebSocketUrl";

const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;
const RECONNECT_BACKOFF_FACTOR = 2;
const MAX_UNCLAIMED_PROMPTS = 50;
const MAX_UNCLAIMED_EVENTS_PER_PROMPT = 200;
const SOCKET_OPEN_STATE = 1;

export type ComfyWebSocket = {
  readonly readyState: number;
  addEventListener(
    type: "open" | "close" | "error" | "message",
    listener: (event: { data?: unknown }) => void
  ): void;
  close(): void;
};

export type CreateComfyWebSocket = (url: string) => ComfyWebSocket;

export type ComfyPromptPhase = "queued" | "running" | "settled";

export type ComfyLivePrompt = {
  phase: ComfyPromptPhase;
  runStartedAt: Date | null;
  progressFraction: number;
};

type ComfyEvent = { type: string; data: Record<string, unknown> };

type TrackedPrompt = {
  weights: Record<string, number>;
  phase: ComfyPromptPhase;
  runStartedAt: Date | null;
  finishedNodeIds: Set<string>;
  currentNodeId: string | null;
  currentNodeStepFraction: number;
  trackedOnConnection: number | null;
};

const SETTLING_EVENT_TYPES = new Set([
  "execution_success",
  "execution_error",
  "execution_interrupted"
]);

const parseComfyEvent = (data: unknown): ComfyEvent | null => {
  if (typeof data !== "string") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }
  const message = asRecord(parsed);
  const payload = asRecord(message?.data);
  if (typeof message?.type !== "string" || !payload) return null;
  return { type: message.type, data: payload };
};

const nodeIdOf = (value: unknown): string | null =>
  typeof value === "string" || typeof value === "number" ? String(value) : null;

export class ComfyProgressMonitor {
  private readonly prompts = new Map<string, TrackedPrompt>();
  private readonly unclaimedEvents = new Map<string, ComfyEvent[]>();
  private readonly settledListeners = new Set<(promptId: string) => void>();
  private socket: ComfyWebSocket | null = null;
  private connectionGeneration = 0;
  private isSocketOpen = false;
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly endpoint: string,
    private readonly clientId: string,
    private readonly createWebSocket: CreateComfyWebSocket
  ) {}

  watch(promptId: string, graph: ComfyGraph): void {
    const prompt: TrackedPrompt = {
      weights: comfyGraphProgressWeights(graph),
      phase: "queued",
      runStartedAt: null,
      finishedNodeIds: new Set(),
      currentNodeId: null,
      currentNodeStepFraction: 0,
      trackedOnConnection: this.isSocketOpen ? this.connectionGeneration : null
    };
    this.prompts.set(promptId, prompt);
    const missedEvents = this.unclaimedEvents.get(promptId) ?? [];
    this.unclaimedEvents.delete(promptId);
    for (const event of missedEvents) this.applyEvent(promptId, event);
    this.ensureConnected();
  }

  forget(promptId: string): void {
    this.prompts.delete(promptId);
    if (this.prompts.size === 0) this.disconnect();
  }

  livePrompt(promptId: string): ComfyLivePrompt | null {
    const prompt = this.prompts.get(promptId);
    const isTrackedOnCurrentConnection =
      this.isSocketOpen &&
      prompt?.trackedOnConnection === this.connectionGeneration;
    if (!prompt || !isTrackedOnCurrentConnection) return null;
    return {
      phase: prompt.phase,
      runStartedAt: prompt.runStartedAt,
      progressFraction: comfyGraphProgressFraction(prompt)
    };
  }

  onPromptSettled(listener: (promptId: string) => void): () => void {
    this.settledListeners.add(listener);
    return () => this.settledListeners.delete(listener);
  }

  waitForSettle(promptId: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(finish, timeoutMs);
      const unsubscribe = this.onPromptSettled((settledPromptId) => {
        if (settledPromptId === promptId) finish();
      });
      function finish() {
        clearTimeout(timer);
        unsubscribe();
        resolve();
      }
    });
  }

  resetConnection(): void {
    this.disconnect();
    for (const prompt of this.prompts.values())
      prompt.trackedOnConnection = null;
    this.ensureConnected();
  }

  close(): void {
    this.prompts.clear();
    this.unclaimedEvents.clear();
    this.disconnect();
  }

  private ensureConnected(): void {
    if (this.socket || this.reconnectTimer || this.prompts.size === 0) return;
    let socket: ComfyWebSocket;
    try {
      socket = this.createWebSocket(
        comfyWebSocketUrl(this.endpoint, this.clientId)
      );
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;
    socket.addEventListener("open", () => {
      if (this.socket !== socket) return;
      this.connectionGeneration += 1;
      this.isSocketOpen = true;
      this.reconnectAttempt = 0;
    });
    socket.addEventListener("message", (event) => {
      if (this.socket !== socket) return;
      const comfyEvent = parseComfyEvent(event.data);
      if (comfyEvent) this.receive(comfyEvent);
    });
    const handleSocketLoss = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.isSocketOpen = false;
      this.scheduleReconnect();
    };
    socket.addEventListener("close", handleSocketLoss);
    socket.addEventListener("error", handleSocketLoss);
    if (socket.readyState === SOCKET_OPEN_STATE) {
      this.connectionGeneration += 1;
      this.isSocketOpen = true;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.prompts.size === 0) return;
    const delay = Math.min(
      RECONNECT_MAX_DELAY_MS,
      RECONNECT_BASE_DELAY_MS *
        RECONNECT_BACKOFF_FACTOR ** this.reconnectAttempt
    );
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ensureConnected();
    }, delay);
    this.reconnectTimer.unref?.();
  }

  private disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.reconnectAttempt = 0;
    const socket = this.socket;
    this.socket = null;
    this.isSocketOpen = false;
    socket?.close();
  }

  private receive(event: ComfyEvent): void {
    const promptId =
      typeof event.data.prompt_id === "string" ? event.data.prompt_id : null;
    if (!promptId) return;
    if (this.prompts.has(promptId)) {
      this.applyEvent(promptId, event);
      return;
    }
    this.rememberUnclaimedEvent(promptId, event);
  }

  private rememberUnclaimedEvent(promptId: string, event: ComfyEvent): void {
    const events = this.unclaimedEvents.get(promptId) ?? [];
    if (events.length >= MAX_UNCLAIMED_EVENTS_PER_PROMPT) events.shift();
    events.push(event);
    this.unclaimedEvents.delete(promptId);
    this.unclaimedEvents.set(promptId, events);
    while (this.unclaimedEvents.size > MAX_UNCLAIMED_PROMPTS) {
      const oldestPromptId = this.unclaimedEvents.keys().next().value;
      if (oldestPromptId === undefined) break;
      this.unclaimedEvents.delete(oldestPromptId);
    }
  }

  private applyEvent(promptId: string, event: ComfyEvent): void {
    const prompt = this.prompts.get(promptId);
    if (!prompt) return;
    prompt.trackedOnConnection = this.isSocketOpen
      ? this.connectionGeneration
      : prompt.trackedOnConnection;
    if (prompt.phase === "settled") return;
    const { data } = event;
    if (event.type === "execution_start") {
      this.markRunning(
        prompt,
        typeof data.timestamp === "number" ? new Date(data.timestamp) : null
      );
      return;
    }
    if (event.type === "execution_cached") {
      this.markRunning(prompt, null);
      const cachedNodes = Array.isArray(data.nodes) ? data.nodes : [];
      for (const node of cachedNodes) {
        const nodeId = nodeIdOf(node);
        if (nodeId) prompt.finishedNodeIds.add(nodeId);
      }
      return;
    }
    if (event.type === "executing") {
      const nodeId = nodeIdOf(data.node);
      if (nodeId === null) {
        this.settle(promptId, prompt);
        return;
      }
      this.markRunning(prompt, null);
      this.moveToNode(prompt, nodeId);
      return;
    }
    if (event.type === "progress") {
      const nodeId = nodeIdOf(data.node);
      this.markRunning(prompt, null);
      if (nodeId) this.moveToNode(prompt, nodeId);
      const value = typeof data.value === "number" ? data.value : 0;
      const max = typeof data.max === "number" && data.max > 0 ? data.max : 0;
      prompt.currentNodeStepFraction = max ? value / max : 0;
      return;
    }
    if (event.type === "executed") {
      const nodeId = nodeIdOf(data.node);
      if (nodeId) prompt.finishedNodeIds.add(nodeId);
      return;
    }
    if (SETTLING_EVENT_TYPES.has(event.type)) this.settle(promptId, prompt);
  }

  private markRunning(prompt: TrackedPrompt, startedAt: Date | null): void {
    prompt.phase = "running";
    prompt.runStartedAt = prompt.runStartedAt ?? startedAt ?? new Date();
  }

  private moveToNode(prompt: TrackedPrompt, nodeId: string): void {
    if (prompt.currentNodeId === nodeId) return;
    if (prompt.currentNodeId !== null)
      prompt.finishedNodeIds.add(prompt.currentNodeId);
    prompt.currentNodeId = nodeId;
    prompt.currentNodeStepFraction = 0;
  }

  private settle(promptId: string, prompt: TrackedPrompt): void {
    if (prompt.currentNodeId !== null)
      prompt.finishedNodeIds.add(prompt.currentNodeId);
    prompt.phase = "settled";
    for (const listener of this.settledListeners) listener(promptId);
  }
}
