import { backendApiClient } from "@/lib/backend-api-client";
import { isCloudAccountActive } from "@/platform/cloudAccount";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import type { TextModelRequest } from "../../../desktop/shared/textModelRequest";
import { resolveTextModelRoute } from "../../../desktop/shared/textModelRoute";

const POLL_INTERVAL_MS = 2_000;
const REQUEST_TIMEOUT_MS = 30_000;
const JOB_TIMEOUT_MS = 330_000;
const HTTP_ACCEPTED = 202;

const failure = (body: Record<string, unknown>): string => {
  const error = body.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error)
    return String(error.message);
  return typeof body.message === "string"
    ? body.message
    : "Cloud text model request failed";
};

const pause = (signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, POLL_INTERVAL_MS);
    signal.addEventListener("abort", abort, { once: true });
  });

/** Standalone text calls only: no cloud project, media upload or plan is created. */
export const runCloudTextModel = async (
  request: TextModelRequest,
  signal: AbortSignal
): Promise<Record<string, unknown> | null> => {
  const settings = await getLocalDesktopApi().comfy.get();
  const route = resolveTextModelRoute({
    provider: settings.textModelProvider,
    isCloudAccountActive: isCloudAccountActive()
  });
  signal.throwIfAborted();
  if (route === "local") return null;

  const config = { signal, timeout: REQUEST_TIMEOUT_MS };
  if (request.operation === "chat") {
    // The local prompt includes the transcript, tool declarations, guardrails
    // and JSON answer format. Keep the local validation and tool application.
    const { data } = await backendApiClient.post<Record<string, unknown>>(
      "/chat/completionv3",
      {
        apiRequestData: { userInput: request.body.prompt }
      },
      config
    );
    if (data.error || typeof data.content !== "string" || !data.content.trim())
      throw new Error(failure(data));
    return data;
  }

  const path =
    request.operation === "casting" ? "/script/casting" : "/chat/video-prompt";
  const { data: submitted, status } = await backendApiClient.post<
    Record<string, unknown>
  >(`${path}?async=true`, request.body, config);
  // The backend's insufficient-balance response is HTTP 200 with an error.
  if (
    status !== HTTP_ACCEPTED ||
    submitted.status !== "PENDING" ||
    typeof submitted.job_id !== "string" ||
    !submitted.job_id
  )
    throw new Error(failure(submitted));
  const deadline = Date.now() + JOB_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await pause(signal);
    const { data } = await backendApiClient.get<Record<string, unknown>>(
      `${path}/jobs/${encodeURIComponent(submitted.job_id)}`,
      config
    );
    if (data.status === "COMPLETED") {
      const { status: _status, ...result } = data;
      if (request.operation === "casting") {
        if (
          !result.casting ||
          typeof result.casting !== "object" ||
          Array.isArray(result.casting)
        )
          throw new Error("Cloud casting returned no casting data");
      } else if (typeof result.prompt !== "string" || !result.prompt.trim()) {
        throw new Error("Cloud video prompt returned no prompt");
      }
      return result;
    }
    if (data.status !== "PENDING") throw new Error(failure(data));
  }
  throw new Error("Cloud text model job timed out");
};
