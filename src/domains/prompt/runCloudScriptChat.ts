import { backendCloudApi } from "@domains/cloud/backendCloudApi";
import { ensureCloudMirrorOfLocalProject } from "@domains/cloud/ensureCloudMirrorOfLocalProject";
import { isAxiosError } from "axios";

import { backendApiClient } from "@/lib/backend-api-client";

import { pauseUnlessAborted } from "./utils/pauseUnlessAborted";
import { toLocalScriptChatAnswer } from "./utils/toLocalScriptChatAnswer";

const POLL_INTERVAL_MS = 2_000;
const REQUEST_TIMEOUT_MS = 30_000;
const REPLY_TIMEOUT_MS = 330_000;
const HTTP_CONFLICT = 409;
const MESSAGES_READ_PER_POLL = 5;
const CLOUD_HISTORY_MESSAGES_BACKEND_CEILING = 100;

type CloudChatMessage = {
  id?: unknown;
  status?: unknown;
  error?: unknown;
  content?: unknown;
  function_call?: unknown;
  function_calls?: unknown;
};

type CloudScriptChatBody = {
  message?: unknown;
  system_prompt?: unknown;
  tools?: unknown;
};

const readInFlightMessageId = (error: unknown): string | null => {
  if (!isAxiosError(error) || error.response?.status !== HTTP_CONFLICT)
    return null;
  const inFlightMessageId = (error.response.data as { message_id?: unknown })
    ?.message_id;
  return typeof inFlightMessageId === "string" ? inFlightMessageId : null;
};

const waitForCloudReply = async (
  cloudProjectId: string,
  messageId: string,
  signal: AbortSignal
): Promise<CloudChatMessage> => {
  const deadline = Date.now() + REPLY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await pauseUnlessAborted(POLL_INTERVAL_MS, signal);
    const { data } = await backendApiClient.get<{ messages?: unknown }>(
      "/chat/message",
      {
        signal,
        timeout: REQUEST_TIMEOUT_MS,
        params: { project_id: cloudProjectId, limit: MESSAGES_READ_PER_POLL }
      }
    );
    const messages = Array.isArray(data.messages)
      ? (data.messages as CloudChatMessage[])
      : [];
    const reply = messages.find((message) => message.id === messageId);
    if (reply?.status === "COMPLETED") return reply;
    if (reply?.status === "FAILED")
      throw new Error(
        typeof reply.error === "string" && reply.error
          ? reply.error
          : "Mago Cloud chat reply failed"
      );
  }
  throw new Error("Mago Cloud chat reply timed out");
};

export const runCloudScriptChat = async (
  localProjectId: string,
  body: CloudScriptChatBody,
  signal: AbortSignal
): Promise<{ content: string }> => {
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) throw new Error("Chat message is empty");
  const cloudProjectId = await ensureCloudMirrorOfLocalProject(
    backendCloudApi(),
    localProjectId
  );
  signal.throwIfAborted();

  const postMessage = async () =>
    (
      await backendApiClient.post<{ message_id?: unknown }>(
        "/chat/message",
        {
          project_id: cloudProjectId,
          message,
          history_messages: CLOUD_HISTORY_MESSAGES_BACKEND_CEILING,
          ...(typeof body.system_prompt === "string" && body.system_prompt
            ? { system_prompt: body.system_prompt }
            : {}),
          ...(Array.isArray(body.tools) && body.tools.length
            ? { tools: body.tools }
            : {})
        },
        { signal, timeout: REQUEST_TIMEOUT_MS }
      )
    ).data.message_id;

  let messageId: unknown;
  try {
    messageId = await postMessage();
  } catch (error) {
    const inFlightMessageId = readInFlightMessageId(error);
    if (!inFlightMessageId) throw error;
    await waitForCloudReply(cloudProjectId, inFlightMessageId, signal).catch(
      () => undefined
    );
    messageId = await postMessage();
  }
  if (typeof messageId !== "string" || !messageId)
    throw new Error("Mago Cloud did not accept the chat message");

  const reply = await waitForCloudReply(cloudProjectId, messageId, signal);
  return { content: toLocalScriptChatAnswer(reply) };
};
