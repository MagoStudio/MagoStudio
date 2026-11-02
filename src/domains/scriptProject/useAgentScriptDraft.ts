import { AgentScriptDocument } from "@schemas/scriptProject";
import { useState } from "react";

import { useSaveProjectSettingsPatch } from "./useSaveProjectSettingsPatch";
import { buildAgentScriptText } from "./utils/buildAgentScriptText";
import { restoreDialogueIntoSavedScript } from "./utils/restoreDialogueIntoSavedScript";

/** The script box's text and the Agent's raw document behind it. The
 * live draft wins over the saved script once set, and visibility is gated on "ever written",
 * not on the live draft's current emptiness. */
export const useAgentScriptDraft = (projectId: string) => {
  const { project, saveProjectSettingsPatch } =
    useSaveProjectSettingsPatch(projectId);
  const [scriptBeingEdited, setScriptBeingEdited] = useState<string>();

  const storedScript = project?.settings?.agent_script ?? "";
  const agentScriptDocument = project?.settings?.agent_script_document ?? null;
  const savedScript = restoreDialogueIntoSavedScript(
    storedScript,
    agentScriptDocument
  );
  const agentScriptDraft = scriptBeingEdited ?? savedScript;

  const isScriptBoxOpen =
    scriptBeingEdited !== undefined || savedScript.trim().length > 0;

  return {
    agentScriptDraft,
    agentScriptDocument,
    isScriptBoxOpen,
    setAgentScriptDraft: setScriptBeingEdited,
    saveAgentScriptDraft: () => {
      if (agentScriptDraft === storedScript) return;
      saveProjectSettingsPatch({ agent_script: agentScriptDraft });
    },
    /** Local only — see `useScriptChat`, which persists this together with the chat turn that
     * reported it, in one write, so the two can never race. */
    applyAgentScript: (document: AgentScriptDocument) => {
      setScriptBeingEdited(buildAgentScriptText(document));
    }
  };
};
