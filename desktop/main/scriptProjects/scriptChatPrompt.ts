import type { ScriptChatFunctionCall } from "../database/scriptChatMessageRepository";

import {
  CHAT_GUARDRAIL_PREFIX,
  CHAT_GUARDRAIL_SUFFIX
} from "./prompts/chatGuardrail";
import { stripQwenReasoning } from "./stripQwenReasoning";

/**
 * The local stand-in for the Gemini call in the backend. Gemini takes the system prompt, the history,
 * the guarded user turn and the tool declarations as separate inputs, and
 * `mode="ANY"` forces a function call; the local text model takes one prompt
 * and answers in JSON, so all of that is laid out in the prompt and the call
 * is read back out of the answer. Pure: the model run is the caller's.
 */

type JsonRecord = Record<string, unknown>;

export type ScriptChatTurn = { role: "user" | "assistant"; content: string };

export type ScriptChatToolDeclaration = {
  name: string;
  description?: string;
  parameters?: JsonRecord;
};

export type ScriptChatReply = {
  text: string | null;
  functionCall: ScriptChatFunctionCall | null;
  functionCalls: ScriptChatFunctionCall[];
};

export const CHAT_CONTEXT_MAX_WORDS = 12_000;

const record = (value: unknown): JsonRecord | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const wordCount = (text: string): number =>
  text.split(/\s+/).filter(Boolean).length;

/**
 * Drop whole messages from the
 * oldest end until the window fits, charge the current turn first (it is never
 * trimmed), then start the window on a user turn.
 */
export const trimHistoryToWordBudget = (
  history: ScriptChatTurn[],
  userMessage: string,
  budget: number = CHAT_CONTEXT_MAX_WORDS
): ScriptChatTurn[] => {
  const remaining = budget - wordCount(userMessage);
  if (remaining <= 0) return [];
  const counts = history.map((turn) => wordCount(turn.content));
  let total = counts.reduce((sum, count) => sum + count, 0);
  let start = 0;
  while (start < history.length && total > remaining) {
    total -= counts[start]!;
    start += 1;
  }
  while (start < history.length && history[start]!.role !== "user") {
    start += 1;
  }
  return history.slice(start);
};

/**
 * A tool is a `function_declarations`
 * container (or the camelCase spelling), or a bare declaration.
 */
export const toolDeclarations = (
  tools: unknown[] | undefined
): ScriptChatToolDeclaration[] =>
  (tools ?? []).flatMap((tool) => {
    const container = record(tool);
    if (!container) return [];
    const declarations =
      container.function_declarations ?? container.functionDeclarations;
    const list = Array.isArray(declarations) ? declarations : [container];
    return list.flatMap((declaration) => {
      const value = record(declaration);
      if (!value || typeof value.name !== "string" || !value.name) return [];
      return [
        {
          name: value.name,
          ...(typeof value.description === "string"
            ? { description: value.description }
            : {}),
          ...(record(value.parameters)
            ? { parameters: record(value.parameters)! }
            : {})
        }
      ];
    });
  });

const ANSWER_FORMAT_WITH_TOOLS = [
  "ANSWER FORMAT:",
  "You must answer by calling exactly one of the tools above; never answer in loose prose.",
  'Return one JSON object only: {"function_call": {"name": "<tool name>", "args": {...}}}.',
  "`args` must follow that tool's parameters schema and include every required field."
].join("\n");

const ANSWER_FORMAT_TEXT = [
  "ANSWER FORMAT:",
  'Return one JSON object only: {"text": "<your reply>"}.'
].join("\n");

/** The whole local chat prompt, in the order Gemini receives its parts. */
export const buildScriptChatPrompt = (input: {
  systemPrompt: string | null;
  tools: ScriptChatToolDeclaration[];
  history: ScriptChatTurn[];
  message: string;
}): string => {
  const sections: string[] = [];
  if (input.systemPrompt?.trim()) {
    sections.push(`SYSTEM INSTRUCTIONS:\n${input.systemPrompt.trim()}`);
  }
  if (input.tools.length) {
    sections.push(`TOOLS:\n${JSON.stringify(input.tools, null, 2)}`);
  }
  if (input.history.length) {
    sections.push(
      [
        "CONVERSATION SO FAR (oldest first):",
        ...input.history.map(
          (turn) =>
            `${turn.role === "user" ? "USER" : "ASSISTANT"}: ${turn.content}`
        )
      ].join("\n\n")
    );
  }
  sections.push(
    [
      "CURRENT USER TURN:",
      ...[CHAT_GUARDRAIL_PREFIX, input.message, CHAT_GUARDRAIL_SUFFIX].filter(
        (part) => part.trim()
      )
    ].join("\n\n")
  );
  sections.push(
    input.tools.length ? ANSWER_FORMAT_WITH_TOOLS : ANSWER_FORMAT_TEXT
  );
  return sections.join("\n\n");
};

/** The same prompt with the reason the last answer was unusable, asked once. */
export const buildScriptChatRepairPrompt = (
  prompt: string,
  problem: string
): string =>
  [
    prompt,
    `RETRY REQUIREMENT: The previous answer was rejected: ${problem}.`,
    "Return the complete JSON object immediately, in the answer format above."
  ].join("\n\n");

const toFunctionCall = (value: unknown): ScriptChatFunctionCall | null => {
  const call = record(value);
  if (!call || typeof call.name !== "string" || !call.name) return null;
  const { name, args, ...misplacedArgs } = call;
  return {
    name,
    // Qwen occasionally closes `args` too early and continues emitting valid
    // tool arguments beside it inside `function_call`. Preserve those fields;
    // explicitly nested args win if the model emitted the same key twice.
    args: { ...misplacedArgs, ...(record(args) ?? {}) }
  };
};

const missingRequiredArgs = (
  call: ScriptChatFunctionCall,
  declaration: ScriptChatToolDeclaration
): string[] => {
  const required = declaration.parameters?.required;
  return Array.isArray(required)
    ? required.filter(
        (field): field is string =>
          typeof field === "string" && call.args[field] === undefined
      )
    : [];
};

/**
 * The reply read back out of the model's answer. Throws with the reason when
 * it is unusable, so the caller can ask once more with that reason.
 */
export const parseScriptChatReply = (
  answer: string,
  tools: ScriptChatToolDeclaration[]
): ScriptChatReply => {
  let parsed: JsonRecord | null;
  try {
    parsed = record(JSON.parse(stripQwenReasoning(answer)));
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "the answer was not JSON"
    );
  }
  if (!parsed) throw new Error("the answer was not a JSON object");

  if (!tools.length) {
    const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
    if (!text) throw new Error("the answer has no text");
    return { text, functionCall: null, functionCalls: [] };
  }

  const calls = (
    Array.isArray(parsed.function_calls)
      ? parsed.function_calls.map(toFunctionCall)
      : [toFunctionCall(parsed.function_call ?? parsed)]
  ).filter((call): call is ScriptChatFunctionCall => call !== null);
  if (!calls.length) throw new Error("the answer calls no tool");
  for (const call of calls) {
    const declaration = tools.find((tool) => tool.name === call.name);
    if (!declaration) throw new Error(`"${call.name}" is not one of the tools`);
    const missing = missingRequiredArgs(call, declaration);
    if (missing.length)
      throw new Error(`${call.name} is missing ${missing.join(", ")}`);
  }
  return { text: null, functionCall: calls[0]!, functionCalls: calls };
};

/**
 * A function-call turn stores its serialised
 * call as content, so the replayed history still says which call was made.
 */
export const scriptChatReplyContent = (reply: ScriptChatReply): string => {
  if (reply.text) return reply.text;
  return reply.functionCalls.length > 1
    ? JSON.stringify({ function_calls: reply.functionCalls })
    : JSON.stringify({ function_call: reply.functionCall });
};
