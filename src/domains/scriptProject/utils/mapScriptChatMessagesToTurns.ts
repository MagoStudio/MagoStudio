import { ScriptChatMessageRow } from "@schemas/scriptProject";

import { parseScriptChatResponse } from "./parseScriptChatResponse";
import { splitScriptChatMessage } from "./splitScriptChatMessage";

/** Returns i18n keys/kinds, not `t()` output, so it stays pure — the component resolves the
 * copy. `PENDING` rows are omitted: the working indicator stands in for them. */
export type ScriptChatDisplayTurn =
  | { role: "user"; text: string }
  | { role: "assistant"; kind: "reply"; text: string }
  | { role: "assistant"; kind: "scriptUpdated" }
  | { role: "assistant"; kind: "failed" }
  | { role: "assistant"; kind: "emptyResponse" }
  | { role: "assistant"; kind: "insufficientBalance" };

export const mapScriptChatMessagesToTurns = (
  rows: ScriptChatMessageRow[]
): ScriptChatDisplayTurn[] =>
  rows.flatMap((row): ScriptChatDisplayTurn[] => {
    if (row.role === "user") {
      return [
        { role: "user", text: splitScriptChatMessage(row.content).userText }
      ];
    }

    if (row.status === "PENDING") return [];
    if (row.status === "FAILED") return [{ role: "assistant", kind: "failed" }];

    const outcome = parseScriptChatResponse(row);
    if (outcome.kind === "script") {
      return [{ role: "assistant", kind: "scriptUpdated" }];
    }
    if (outcome.kind === "reply") {
      return [{ role: "assistant", kind: "reply", text: outcome.message }];
    }

    return [{ role: "assistant", kind: "emptyResponse" }];
  });
