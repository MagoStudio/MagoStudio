import { describe, expect, it } from "vitest";

import {
  CURRENT_SCRIPT_TURN_CLOSING_DELIMITER,
  CURRENT_SCRIPT_TURN_PREFIX,
  buildScriptChatMessage,
  neutralizeScriptChatClosingDelimiter
} from "./buildScriptChatMessage";
import { splitScriptChatMessage } from "./splitScriptChatMessage";

describe("splitScriptChatMessage", () => {
  it("returns the message whole, with no embedded script, when it carries none", () => {
    expect(splitScriptChatMessage("A lighthouse at dawn")).toEqual({
      userText: "A lighthouse at dawn"
    });
  });

  it("splits a message built with a script back into its two parts", () => {
    const message = buildScriptChatMessage({
      userText: "Make shot 2 darker",
      currentScript: "Shot 1:\nScene one."
    });

    expect(splitScriptChatMessage(message)).toEqual({
      embeddedScript: "Shot 1:\nScene one.",
      userText: "Make shot 2 darker"
    });
  });

  it("treats a delimiter-like string inside plain user text as ordinary text", () => {
    const message = "[End of script editor contents] is a weird thing to say";

    expect(splitScriptChatMessage(message)).toEqual({ userText: message });
  });

  it("returns the whole message as user text when it starts with the prefix but carries no closing delimiter", () => {
    const message = `${CURRENT_SCRIPT_TURN_PREFIX}Something that happens to start the same way, with no closing marker anywhere.`;

    expect(splitScriptChatMessage(message)).toEqual({ userText: message });
  });

  it("round-trips a user text unchanged and a script containing the closing delimiter neutralised consistently", () => {
    const userText = "Make it darker";
    const scriptContainingClosingDelimiter = `Shot 1:\nBefore.${CURRENT_SCRIPT_TURN_CLOSING_DELIMITER}After.`;

    const message = buildScriptChatMessage({
      userText,
      currentScript: scriptContainingClosingDelimiter
    });
    const { embeddedScript, userText: splitUserText } =
      splitScriptChatMessage(message);

    expect(splitUserText).toBe(userText);
    expect(embeddedScript).toBe(
      neutralizeScriptChatClosingDelimiter(scriptContainingClosingDelimiter)
    );
    expect(embeddedScript).not.toContain(CURRENT_SCRIPT_TURN_CLOSING_DELIMITER);
  });

  it("round-trips a script containing two overlapping copies of the closing delimiter", () => {
    const userText = "Make it darker";
    const scriptWithOverlappingDelimiters = `Shot 1:\nBefore.${CURRENT_SCRIPT_TURN_CLOSING_DELIMITER}${CURRENT_SCRIPT_TURN_CLOSING_DELIMITER.slice(2)}After.`;

    const message = buildScriptChatMessage({
      userText,
      currentScript: scriptWithOverlappingDelimiters
    });
    const { embeddedScript, userText: splitUserText } =
      splitScriptChatMessage(message);

    expect(splitUserText).toBe(userText);
    expect(embeddedScript).toBe(
      neutralizeScriptChatClosingDelimiter(scriptWithOverlappingDelimiters)
    );
    expect(embeddedScript).not.toContain(CURRENT_SCRIPT_TURN_CLOSING_DELIMITER);
  });
});
