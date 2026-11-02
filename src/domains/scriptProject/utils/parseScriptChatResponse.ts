import {
  AgentScriptDocument,
  AgentScriptDocumentSchema,
  ScriptChatFunctionCall
} from "@schemas/scriptProject";

import {
  REPLY_FUNCTION,
  WRITE_SCRIPT_FUNCTION
} from "./buildScriptChatRequestBody";

export type ScriptChatOutcome =
  | { kind: "script"; document: AgentScriptDocument }
  | { kind: "reply"; message: string }
  | { kind: "emptyResponse" };

const findFunctionCall = (
  functionCalls: ScriptChatFunctionCall[],
  functionName: string
) => functionCalls.find((call) => call.name === functionName);

const readWrittenScript = (
  functionCalls: ScriptChatFunctionCall[]
): AgentScriptDocument | undefined => {
  const call = findFunctionCall(functionCalls, WRITE_SCRIPT_FUNCTION);
  if (!call?.args) return undefined;

  const parsedDocument = AgentScriptDocumentSchema.safeParse(call.args);
  if (!parsedDocument.success) return undefined;

  const nonBlankLegacyScenes = parsedDocument.data.scenes
    .map((scene) => ({ ...scene, prompt: scene.prompt.trim() }))
    .filter((scene) => scene.prompt.length > 0);

  const nonBlankScreenplayScenes = parsedDocument.data.screenplay_scenes
    .map((scene) => ({
      ...scene,
      heading: scene.heading.trim(),
      elements: scene.elements.filter(
        (element) => element.text.trim().length > 0
      )
    }))
    .filter((scene) => scene.heading.length > 0 || scene.elements.length > 0);

  const documentHasAnyScene =
    nonBlankLegacyScenes.length > 0 || nonBlankScreenplayScenes.length > 0;

  return documentHasAnyScene
    ? {
        ...parsedDocument.data,
        scenes: nonBlankLegacyScenes,
        screenplay_scenes: nonBlankScreenplayScenes
      }
    : undefined;
};

const readReplyMessage = (
  functionCalls: ScriptChatFunctionCall[]
): string | undefined => {
  const call = findFunctionCall(functionCalls, REPLY_FUNCTION);
  const message = call?.args?.message;

  return typeof message === "string" && message.trim()
    ? message.trim()
    : undefined;
};

export const parseScriptChatResponse = (
  row:
    | {
        function_call?: ScriptChatFunctionCall | null;
        function_calls?: ScriptChatFunctionCall[] | null;
      }
    | undefined
): ScriptChatOutcome => {
  const functionCalls = [
    ...(row?.function_call ? [row.function_call] : []),
    ...(row?.function_calls ?? [])
  ];

  const writtenScript = readWrittenScript(functionCalls);
  if (writtenScript) return { kind: "script", document: writtenScript };

  const replyMessage = readReplyMessage(functionCalls);
  if (replyMessage) return { kind: "reply", message: replyMessage };

  return { kind: "emptyResponse" };
};
