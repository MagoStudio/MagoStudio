import { describe, expect, it } from "vitest";

import {
  CURRENT_SCRIPT_TURN_CLOSING_DELIMITER,
  neutralizeScriptChatClosingDelimiter
} from "./buildScriptChatMessage";
import { shouldApplyDeliveredScript } from "./shouldApplyDeliveredScript";

describe("shouldApplyDeliveredScript", () => {
  it("applies when the box still holds exactly what the preceding message carried", () => {
    expect(
      shouldApplyDeliveredScript({
        deliveredScript: "Shot 1:\nA new scene.",
        embeddedScriptInPrecedingUserMessage: "Shot 1:\nOld scene.",
        scriptBoxText: "Shot 1:\nOld scene."
      })
    ).toBe(true);
  });

  it("applies when the box is empty and the preceding message carried no script", () => {
    expect(
      shouldApplyDeliveredScript({
        deliveredScript: "Shot 1:\nA new scene.",
        embeddedScriptInPrecedingUserMessage: undefined,
        scriptBoxText: ""
      })
    ).toBe(true);
  });

  it("leaves the box alone when it holds a hand edit made since sending", () => {
    expect(
      shouldApplyDeliveredScript({
        deliveredScript: "Shot 1:\nA new scene.",
        embeddedScriptInPrecedingUserMessage: "Shot 1:\nOld scene.",
        scriptBoxText: "Shot 1:\nA hand-edited scene."
      })
    ).toBe(false);
  });

  it("leaves the box alone when it is non-empty but the preceding message carried no script", () => {
    expect(
      shouldApplyDeliveredScript({
        deliveredScript: "Shot 1:\nA new scene.",
        embeddedScriptInPrecedingUserMessage: undefined,
        scriptBoxText: "Something the user typed directly."
      })
    ).toBe(false);
  });

  it("is idempotent — once the box already holds the delivered script, it does not apply again", () => {
    expect(
      shouldApplyDeliveredScript({
        deliveredScript: "Shot 1:\nA new scene.",
        embeddedScriptInPrecedingUserMessage: "Shot 1:\nOld scene.",
        scriptBoxText: "Shot 1:\nA new scene."
      })
    ).toBe(false);
  });

  it("matches a box holding a script that contains the closing delimiter, once both sides are neutralised the same way", () => {
    const oldScriptContainingClosingDelimiter = `Shot 1:\nBefore.${CURRENT_SCRIPT_TURN_CLOSING_DELIMITER}After.`;
    const neutralisedOldScript = neutralizeScriptChatClosingDelimiter(
      oldScriptContainingClosingDelimiter
    );

    expect(
      shouldApplyDeliveredScript({
        deliveredScript: "Shot 1:\nA new scene.",
        embeddedScriptInPrecedingUserMessage: neutralisedOldScript,
        scriptBoxText: neutralizeScriptChatClosingDelimiter(
          oldScriptContainingClosingDelimiter
        )
      })
    ).toBe(true);
  });

  it("matches a box holding a script that contains two overlapping copies of the closing delimiter", () => {
    const oldScriptWithOverlappingDelimiters = `Shot 1:\nBefore.${CURRENT_SCRIPT_TURN_CLOSING_DELIMITER}${CURRENT_SCRIPT_TURN_CLOSING_DELIMITER.slice(2)}After.`;
    const neutralisedOldScript = neutralizeScriptChatClosingDelimiter(
      oldScriptWithOverlappingDelimiters
    );

    expect(
      shouldApplyDeliveredScript({
        deliveredScript: "Shot 1:\nA new scene.",
        embeddedScriptInPrecedingUserMessage: neutralisedOldScript,
        scriptBoxText: neutralizeScriptChatClosingDelimiter(
          oldScriptWithOverlappingDelimiters
        )
      })
    ).toBe(true);
  });
});
