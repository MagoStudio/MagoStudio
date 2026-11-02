import type {
  LocalScriptChatMessageAccepted,
  LocalScriptChatMessageInput,
  LocalScriptChatMessages
} from "../../shared/contracts";
import {
  ScriptChatMessage,
  ScriptChatMessageRepository,
  ScriptChatReplyInFlightError
} from "../database/scriptChatMessageRepository";
import { runBackgroundTask } from "../libraryHealth";

import {
  buildScriptChatPrompt,
  buildScriptChatRepairPrompt,
  parseScriptChatReply,
  scriptChatReplyContent,
  toolDeclarations,
  trimHistoryToWordBudget,
  type ScriptChatReply,
  type ScriptChatToolDeclaration
} from "./scriptChatPrompt";

const HISTORY_DEFAULT_LIMIT = 20;
const HISTORY_MAX_LIMIT = 100;

const ORPHANED_ERROR =
  "the reply was interrupted before it finished (the app was closed or restarted)";

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "the reply failed";

const toWireMessage = (message: ScriptChatMessage) => {
  const error = message.data.error;
  return {
    id: message.id,
    role: message.role,
    status: message.status,
    // The cloud sends null for a reply with no text yet (PENDING) or ever
    // (FAILED), which the renderer's schema cannot read and drops — so a
    // failed turn never shows as failed. An empty string keeps the row.
    content: message.content ?? "",
    error:
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : null,
    function_call: message.data.function_call ?? null,
    function_calls: message.data.function_calls ?? null,
    created_at: message.createdAt.toISOString()
  };
};

/**
 * The local `/chat/message`: the backend's project chat, with the Gemini call replaced by the local
 * script text model or a standalone cloud completion. Same local rows,
 * PENDING marker and history window on both routes.
 *
 * Replies run in this process, so a PENDING row this process is not running
 * was left by an earlier session and can never finish — it is failed on the
 * next read, which is what keeps the chat answerable after a restart.
 */
export class LocalScriptChatService {
  private readonly running = new Set<string>();
  /** Projects whose turn is being written: its PENDING row exists before its
   *  reply is registered as running, and must not be mistaken for an orphan. */
  private readonly startingProjects = new Set<string>();

  constructor(
    private readonly messages: ScriptChatMessageRepository,
    private readonly assertLocalProject: (projectId: string) => Promise<void>,
    private readonly runChat: (
      prompt: string
    ) => Promise<string | { content: string; model: string }>
  ) {}

  async list(
    projectId: string,
    limit = HISTORY_DEFAULT_LIMIT
  ): Promise<LocalScriptChatMessages> {
    await this.assertLocalProject(projectId);
    await this.expireOrphans(projectId);
    const rows = await this.messages.listRecent(
      projectId,
      Math.min(Math.max(1, Math.floor(limit)), HISTORY_MAX_LIMIT)
    );
    return {
      project_id: projectId,
      pending: rows.at(-1)?.status === "PENDING",
      messages: rows.map(toWireMessage)
    };
  }

  async post(
    input: LocalScriptChatMessageInput
  ): Promise<LocalScriptChatMessageAccepted> {
    await this.assertLocalProject(input.projectId);
    const message = input.message.trim();
    if (!message) throw new Error("message is required");
    const tools = toolDeclarations(input.tools);

    await this.expireOrphans(input.projectId);
    const [inFlight] = await this.messages.listPending(input.projectId);
    // The cloud answers 409; the renderer treats that as accepted, so the
    // in-flight reply is returned as the accepted one.
    if (inFlight) return this.accepted(inFlight);

    const systemPrompt =
      input.systemPrompt?.trim() ||
      (await this.messages.latestSystemPrompt(
        input.projectId,
        HISTORY_MAX_LIMIT
      ));
    const historyLimit = Math.min(
      Math.max(1, Math.floor(input.historyMessages ?? HISTORY_MAX_LIMIT)),
      HISTORY_MAX_LIMIT
    );
    const history = trimHistoryToWordBudget(
      (await this.messages.listRecent(input.projectId, historyLimit))
        .filter((row) => row.status === "COMPLETED" && row.content?.trim())
        .map((row) => ({ role: row.role, content: row.content! })),
      message
    );

    let answer: ScriptChatMessage;
    this.startingProjects.add(input.projectId);
    try {
      ({ answer } = await this.messages.insertTurn({
        projectId: input.projectId,
        message,
        replyData: { system_prompt: systemPrompt }
      }));
      this.running.add(answer.id);
    } catch (error) {
      if (error instanceof ScriptChatReplyInFlightError)
        return this.accepted(error.inFlight);
      throw error;
    } finally {
      this.startingProjects.delete(input.projectId);
    }

    void runBackgroundTask("Script chat", () =>
      this.answer(
        answer.id,
        buildScriptChatPrompt({ systemPrompt, tools, history, message }),
        tools
      ).finally(() => this.running.delete(answer.id))
    );
    return this.accepted(answer);
  }

  private accepted(message: ScriptChatMessage): LocalScriptChatMessageAccepted {
    return {
      message_id: message.id,
      status: message.status,
      created_at: message.createdAt.toISOString()
    };
  }

  /** One model run, plus one repair when the answer is unusable. */
  private async answer(
    answerId: string,
    prompt: string,
    tools: ScriptChatToolDeclaration[]
  ): Promise<void> {
    try {
      let reply: ScriptChatReply;
      let model = "local";
      const run = async (input: string) => {
        const result = await this.runChat(input);
        if (typeof result === "string") {
          model = "local";
          return result;
        }
        model = result.model;
        return result.content;
      };
      try {
        reply = parseScriptChatReply(await run(prompt), tools);
      } catch (firstError) {
        reply = parseScriptChatReply(
          await run(
            buildScriptChatRepairPrompt(prompt, errorMessage(firstError))
          ),
          tools
        );
      }
      await this.messages.finishReply(answerId, {
        status: "COMPLETED",
        model,
        content: scriptChatReplyContent(reply),
        functionCall: reply.functionCall,
        functionCalls: reply.functionCalls
      });
    } catch (error) {
      console.error("Local script chat reply failed", error);
      await this.messages
        .finishReply(answerId, { status: "FAILED", error: errorMessage(error) })
        .catch((writeError: unknown) =>
          console.error("Could not record the failed chat reply", writeError)
        );
    }
  }

  private async expireOrphans(projectId: string): Promise<void> {
    if (this.startingProjects.has(projectId)) return;
    for (const row of await this.messages.listPending(projectId)) {
      // Re-checked per row: a turn may have started while the list was read.
      if (this.running.has(row.id) || this.startingProjects.has(projectId))
        continue;
      await this.messages.finishReply(row.id, {
        status: "FAILED",
        error: ORPHANED_ERROR
      });
    }
  }
}
