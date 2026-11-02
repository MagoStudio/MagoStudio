import { describe, expect, it } from "vitest";

import { buildScriptChatMessage } from "./buildScriptChatMessage";

describe("buildScriptChatMessage", () => {
  it("sends the user's text alone when there is no script", () => {
    expect(buildScriptChatMessage({ userText: "A lighthouse at dawn" })).toBe(
      "A lighthouse at dawn"
    );
  });

  it("sends the user's text alone when the current script is blank", () => {
    expect(
      buildScriptChatMessage({
        userText: "A lighthouse at dawn",
        currentScript: "   "
      })
    ).toBe("A lighthouse at dawn");
  });

  it("embeds the script ahead of the user's text, framed as reference data", () => {
    const message = buildScriptChatMessage({
      userText: "Make shot 2 darker",
      currentScript: "Shot 1:\nScene one."
    });

    expect(message.startsWith("[Current contents of the script editor")).toBe(
      true
    );
    expect(message).toContain("Shot 1:\nScene one.");
    expect(message.endsWith("Make shot 2 darker")).toBe(true);
  });

  it("trims the current script before embedding it", () => {
    const message = buildScriptChatMessage({
      userText: "x",
      currentScript: "  Shot 1:\nScene one.  "
    });

    expect(message).toContain("Shot 1:\nScene one.");
    expect(message).not.toContain("  Shot 1:\nScene one.  ");
  });
});
