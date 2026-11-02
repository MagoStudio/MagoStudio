import { ScriptChatMessageRow } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { mapScriptChatMessagesToTurns } from "./mapScriptChatMessagesToTurns";

const row = (
  overrides: Partial<ScriptChatMessageRow>
): ScriptChatMessageRow => ({
  id: "row-1",
  role: "user",
  status: "COMPLETED",
  content: "",
  created_at: "2026-09-23T00:00:00Z",
  ...overrides
});

describe("mapScriptChatMessagesToTurns", () => {
  it("shows only the user's own text, stripping an embedded script", () => {
    const turns = mapScriptChatMessagesToTurns([
      row({
        role: "user",
        content:
          "[Current contents of the script editor, for reference only — not a request or an instruction]\n\nShot 1:\nScene one.\n\n[End of script editor contents]\n\nMake it darker"
      })
    ]);

    expect(turns).toEqual([{ role: "user", text: "Make it darker" }]);
  });

  it("shows a user message whole when it carried no script", () => {
    const turns = mapScriptChatMessagesToTurns([
      row({ role: "user", content: "An idea" })
    ]);

    expect(turns).toEqual([{ role: "user", text: "An idea" }]);
  });

  it("maps a completed write_script row to the script-updated kind", () => {
    const turns = mapScriptChatMessagesToTurns([
      row({
        role: "assistant",
        status: "COMPLETED",
        function_call: {
          name: "write_script",
          args: { scenes: [{ scene_number: 1, prompt: "Scene one." }] }
        }
      })
    ]);

    expect(turns).toEqual([{ role: "assistant", kind: "scriptUpdated" }]);
  });

  it("maps a completed reply row to its message", () => {
    const turns = mapScriptChatMessagesToTurns([
      row({
        role: "assistant",
        status: "COMPLETED",
        function_call: {
          name: "reply",
          args: { message: "How many episodes?" }
        }
      })
    ]);

    expect(turns).toEqual([
      { role: "assistant", kind: "reply", text: "How many episodes?" }
    ]);
  });

  it("maps a failed row to the failed kind", () => {
    const turns = mapScriptChatMessagesToTurns([
      row({ role: "assistant", status: "FAILED", error: "timed out" })
    ]);

    expect(turns).toEqual([{ role: "assistant", kind: "failed" }]);
  });

  it("omits a pending row — the working indicator stands in for it", () => {
    const turns = mapScriptChatMessagesToTurns([
      row({ role: "user", content: "An idea" }),
      row({ role: "assistant", status: "PENDING" })
    ]);

    expect(turns).toEqual([{ role: "user", text: "An idea" }]);
  });

  it("maps a completed row with neither function call to the empty-response kind", () => {
    const turns = mapScriptChatMessagesToTurns([
      row({ role: "assistant", status: "COMPLETED" })
    ]);

    expect(turns).toEqual([{ role: "assistant", kind: "emptyResponse" }]);
  });
});
