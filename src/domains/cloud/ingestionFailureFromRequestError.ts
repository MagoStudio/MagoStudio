import { describeIngestionErrorPayload } from "./describeIngestionErrorPayload";

const HTTP_UNPROCESSABLE_ENTITY = 422;

export const ingestionFailureFromRequestError = (
  requestError: unknown
): string | null => {
  const response = (
    requestError as { response?: { status?: unknown; data?: unknown } } | null
  )?.response;
  if (response?.status !== HTTP_UNPROCESSABLE_ENTITY) return null;
  const errorPayload = (response.data as { error?: unknown } | null)?.error;
  return describeIngestionErrorPayload(errorPayload);
};
