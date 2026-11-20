import { describe, expect, it } from "vitest";

import { toLocalScriptChatAnswer } from "./toLocalScriptChatAnswer";

const writeScript = { name: "write_script", args: { script: "INT. BANK" } };
const reply = { name: "reply", args: { text: "Done" } };

describe("toLocalScriptChatAnswer", () => {
  it("keeps every call of a multi-call turn, in order", () => {
    expect(
      JSON.parse(
        toLocalScriptChatAnswer({
          content: "{}",
          function_call: writeScript,
          function_calls: [writeScript, reply]
        })
      )
    ).toEqual({ function_calls: [writeScript, reply] });
  });

  it("reads a single call written before function_calls existed", () => {
    expect(
      JSON.parse(
        toLocalScriptChatAnswer({
          function_call: writeScript,
          function_calls: null
        })
      )
    ).toEqual({ function_call: writeScript });
  });

  it("wraps a prose turn as text", () => {
    expect(
      JSON.parse(
        toLocalScriptChatAnswer({ content: "Hello", function_calls: null })
      )
    ).toEqual({ text: "Hello" });
  });
});
