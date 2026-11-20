type CloudChatMessage = {
  content?: unknown;
  function_call?: unknown;
  function_calls?: unknown;
};

export const toLocalScriptChatAnswer = (
  cloudReply: CloudChatMessage
): string => {
  if (
    Array.isArray(cloudReply.function_calls) &&
    cloudReply.function_calls.length
  )
    return JSON.stringify({ function_calls: cloudReply.function_calls });
  if (cloudReply.function_call)
    return JSON.stringify({ function_call: cloudReply.function_call });
  return JSON.stringify({
    text: typeof cloudReply.content === "string" ? cloudReply.content : ""
  });
};
