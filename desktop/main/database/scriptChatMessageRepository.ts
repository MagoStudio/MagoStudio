import { randomUUID } from "node:crypto";

import { and, asc, desc, eq } from "drizzle-orm";

import { DatabaseManager } from "./databaseManager";
import { scriptChatMessages } from "./schema";

export type ScriptChatRole = "user" | "assistant";
export type ScriptChatStatus = "PENDING" | "COMPLETED" | "FAILED";

export type ScriptChatFunctionCall = {
  name: string;
  args: Record<string, unknown>;
};

export type ScriptChatMessage = {
  id: string;
  projectId: string;
  role: ScriptChatRole;
  status: ScriptChatStatus;
  content: string | null;
  data: Record<string, unknown>;
  createdAt: Date;
};

/** Raised when a second turn races a reply that is still being written — the
 *  partial unique index lets only one PENDING row per project in. */
export class ScriptChatReplyInFlightError extends Error {
  constructor(readonly inFlight: ScriptChatMessage) {
    super(`A reply is already in flight for message ${inFlight.id}`);
  }
}

const MAX_STORED_ERROR_LENGTH = 500;

const parseData = (value: string): Record<string, unknown> => {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const toMessage = (
  row: typeof scriptChatMessages.$inferSelect
): ScriptChatMessage => ({
  id: row.id,
  projectId: row.projectId,
  role: row.role,
  status: row.status,
  content: row.content,
  data: parseData(row.dataJson),
  createdAt: row.createdAt
});

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Error && /UNIQUE constraint failed/i.test(error.message);

/** The local store behind the script project chat — the backend's
 *  `chat_message` rows, one chat per project. */
export class ScriptChatMessageRepository {
  constructor(private readonly manager: DatabaseManager) {}

  /** The last `limit` messages, oldest first. */
  async listRecent(
    projectId: string,
    limit: number
  ): Promise<ScriptChatMessage[]> {
    const rows = await this.manager
      .get()
      .select()
      .from(scriptChatMessages)
      .where(eq(scriptChatMessages.projectId, projectId))
      .orderBy(desc(scriptChatMessages.createdAt), desc(scriptChatMessages.id))
      .limit(limit);
    return rows.map(toMessage).reverse();
  }

  async listPending(projectId: string): Promise<ScriptChatMessage[]> {
    const rows = await this.manager
      .get()
      .select()
      .from(scriptChatMessages)
      .where(
        and(
          eq(scriptChatMessages.projectId, projectId),
          eq(scriptChatMessages.status, "PENDING")
        )
      )
      .orderBy(asc(scriptChatMessages.createdAt));
    return rows.map(toMessage);
  }

  /**
   * Write the user's turn and the PENDING reply together. The reply is a
   * millisecond later so ordering by `created_at` alone never puts it first.
   */
  async insertTurn(input: {
    projectId: string;
    message: string;
    replyData: Record<string, unknown>;
  }): Promise<{ question: ScriptChatMessage; answer: ScriptChatMessage }> {
    const askedAt = new Date();
    const answeredAt = new Date(askedAt.getTime() + 1);
    const question = {
      id: randomUUID(),
      projectId: input.projectId,
      role: "user" as const,
      status: "COMPLETED" as const,
      content: input.message,
      dataJson: "{}",
      createdAt: askedAt,
      updatedAt: askedAt
    };
    const answer = {
      id: randomUUID(),
      projectId: input.projectId,
      role: "assistant" as const,
      status: "PENDING" as const,
      content: null,
      dataJson: JSON.stringify(input.replyData),
      createdAt: answeredAt,
      updatedAt: answeredAt
    };
    try {
      await this.manager.transaction(async (database) => {
        await database.insert(scriptChatMessages).values([question, answer]);
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const [winner] = await this.listPending(input.projectId);
      if (!winner) throw error;
      throw new ScriptChatReplyInFlightError(winner);
    }
    return { question: toMessage(question), answer: toMessage(answer) };
  }

  /**
   * The terminal write onto a reply. Conditional on it still being PENDING, so
   * a reply that finishes after its row was already failed cannot bring it
   * back. Returns whether the write applied.
   */
  async finishReply(
    id: string,
    result:
      | {
          status: "COMPLETED";
          model?: string;
          content: string;
          functionCall: ScriptChatFunctionCall | null;
          functionCalls: ScriptChatFunctionCall[];
        }
      | { status: "FAILED"; error: string }
  ): Promise<boolean> {
    const database = this.manager.get();
    const [row] = await database
      .select()
      .from(scriptChatMessages)
      .where(eq(scriptChatMessages.id, id))
      .limit(1);
    if (!row || row.status !== "PENDING") return false;
    const data = parseData(row.dataJson);
    data.finished_at = new Date().toISOString();
    if (result.status === "COMPLETED") {
      if (result.model) data.model = result.model;
      if (result.functionCall) data.function_call = result.functionCall;
      if (result.functionCalls.length)
        data.function_calls = result.functionCalls;
    } else {
      data.error = { message: result.error.slice(0, MAX_STORED_ERROR_LENGTH) };
    }
    const updated = await database
      .update(scriptChatMessages)
      .set({
        status: result.status,
        ...(result.status === "COMPLETED" ? { content: result.content } : {}),
        dataJson: JSON.stringify(data),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(scriptChatMessages.id, id),
          eq(scriptChatMessages.status, "PENDING")
        )
      )
      .returning({ id: scriptChatMessages.id });
    return updated.length > 0;
  }

  /** The system prompt this chat was last run with, for a turn that sends none. */
  async latestSystemPrompt(
    projectId: string,
    searchDepth: number
  ): Promise<string | null> {
    for (const message of (
      await this.listRecent(projectId, searchDepth)
    ).reverse()) {
      const stored = message.data.system_prompt;
      if (typeof stored === "string" && stored.trim()) return stored;
    }
    return null;
  }
}
