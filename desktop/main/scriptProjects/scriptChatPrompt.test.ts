import { describe, expect, it } from "vitest";

import {
  CHAT_GUARDRAIL_PREFIX,
  CHAT_GUARDRAIL_SUFFIX
} from "./prompts/chatGuardrail";
import {
  buildScriptChatPrompt,
  parseScriptChatReply,
  scriptChatReplyContent,
  toolDeclarations,
  trimHistoryToWordBudget,
  type ScriptChatToolDeclaration
} from "./scriptChatPrompt";

const TOOLS: ScriptChatToolDeclaration[] = [
  {
    name: "write_script",
    parameters: {
      type: "object",
      properties: { scenes: { type: "array" } },
      required: ["scenes"]
    }
  },
  {
    name: "reply",
    parameters: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"]
    }
  }
];

describe("trimHistoryToWordBudget", () => {
  const history = [
    { role: "user" as const, content: "one two three" },
    { role: "assistant" as const, content: "four five" },
    { role: "user" as const, content: "six" },
    { role: "assistant" as const, content: "seven eight" }
  ];

  it("keeps everything that fits", () => {
    expect(trimHistoryToWordBudget(history, "now", 100)).toEqual(history);
  });

  it("drops whole messages from the oldest end and starts on a user turn", () => {
    // 1 word for the turn leaves 4: dropping the first message fits, but the
    // window would then open on an assistant reply, so that goes too.
    expect(trimHistoryToWordBudget(history, "now", 5)).toEqual(
      history.slice(2)
    );
  });

  it("never trims the current turn, even when it alone is over budget", () => {
    expect(trimHistoryToWordBudget(history, "a b c d e f", 5)).toEqual([]);
  });
});

describe("toolDeclarations", () => {
  it("reads containers in either spelling and bare declarations", () => {
    expect(
      toolDeclarations([
        { function_declarations: [{ name: "write_script" }] },
        { functionDeclarations: [{ name: "reply", description: "talk" }] },
        { name: "bare" },
        { function_declarations: [] },
        "not a tool"
      ])
    ).toEqual([
      { name: "write_script" },
      { name: "reply", description: "talk" },
      { name: "bare" }
    ]);
  });
});

describe("buildScriptChatPrompt", () => {
  it("guards only the current turn and asks for a function call", () => {
    const prompt = buildScriptChatPrompt({
      systemPrompt: "You are the script agent.",
      tools: TOOLS,
      history: [{ role: "user", content: "earlier question" }],
      message: "write me a script"
    });
    expect(
      prompt.startsWith("SYSTEM INSTRUCTIONS:\nYou are the script agent.")
    ).toBe(true);
    expect(prompt).toContain('"name": "write_script"');
    expect(prompt).toContain("USER: earlier question");
    expect(prompt).toContain(
      `${CHAT_GUARDRAIL_PREFIX}\n\nwrite me a script\n\n${CHAT_GUARDRAIL_SUFFIX}`
    );
    expect(prompt.indexOf("earlier question")).toBeLessThan(
      prompt.indexOf(CHAT_GUARDRAIL_PREFIX)
    );
    expect(prompt).toContain('{"function_call": {"name": "<tool name>"');
  });

  it("asks for plain text when no tools are declared", () => {
    expect(
      buildScriptChatPrompt({
        systemPrompt: null,
        tools: [],
        history: [],
        message: "hello"
      })
    ).toContain('{"text": "<your reply>"}');
  });
});

describe("parseScriptChatReply", () => {
  it("reads the call out of a reasoning-prefixed answer", () => {
    expect(
      parseScriptChatReply(
        '<think>plan</think>{"function_call": {"name": "reply", "args": {"message": "hi"}}}',
        TOOLS
      )
    ).toEqual({
      text: null,
      functionCall: { name: "reply", args: { message: "hi" } },
      functionCalls: [{ name: "reply", args: { message: "hi" } }]
    });
  });

  it("accepts a bare call and parallel calls", () => {
    expect(
      parseScriptChatReply('{"name": "reply", "args": {"message": "x"}}', TOOLS)
        .functionCall
    ).toEqual({ name: "reply", args: { message: "x" } });
    expect(
      parseScriptChatReply(
        '{"function_calls": [{"name": "reply", "args": {"message": "a"}}, {"name": "write_script", "args": {"scenes": []}}]}',
        TOOLS
      ).functionCalls
    ).toHaveLength(2);
  });

  it("recovers tool arguments emitted beside args inside function_call", () => {
    expect(
      parseScriptChatReply(
        JSON.stringify({
          function_call: {
            name: "write_script",
            args: { series_title: "Whiskers" },
            scenes: [{ scene_number: 1, prompt: "Wide shot" }],
            caption: "A missing sardine."
          }
        }),
        TOOLS
      ).functionCall
    ).toEqual({
      name: "write_script",
      args: {
        series_title: "Whiskers",
        scenes: [{ scene_number: 1, prompt: "Wide shot" }],
        caption: "A missing sardine."
      }
    });
  });

  it("rejects an unknown tool, a missing required field and prose", () => {
    expect(() =>
      parseScriptChatReply('{"function_call": {"name": "delete_all"}}', TOOLS)
    ).toThrow('"delete_all" is not one of the tools');
    expect(() =>
      parseScriptChatReply(
        '{"function_call": {"name": "write_script", "args": {}}}',
        TOOLS
      )
    ).toThrow("write_script is missing scenes");
    expect(() => parseScriptChatReply("Sure, here you go!", TOOLS)).toThrow();
  });

  it("reads text when no tools were declared", () => {
    expect(parseScriptChatReply('{"text": " hello "}', []).text).toBe("hello");
  });
});

describe("scriptChatReplyContent", () => {
  it("stores the serialised call, so the replayed history says which one was made", () => {
    const call = { name: "reply", args: { message: "hi" } };
    expect(
      scriptChatReplyContent({
        text: null,
        functionCall: call,
        functionCalls: [call]
      })
    ).toBe(JSON.stringify({ function_call: call }));
    expect(
      scriptChatReplyContent({
        text: null,
        functionCall: call,
        functionCalls: [call, call]
      })
    ).toBe(JSON.stringify({ function_calls: [call, call] }));
  });
});
