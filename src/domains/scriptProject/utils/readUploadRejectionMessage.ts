import axios from "axios";

const HTTP_BAD_REQUEST = 400;
const HTTP_TOO_MANY_REQUESTS = 429;

export const readUploadRejectionMessage = (error: unknown): string | null => {
  if (!axios.isAxiosError(error)) return null;
  const status = error.response?.status;
  if (status !== HTTP_BAD_REQUEST && status !== HTTP_TOO_MANY_REQUESTS)
    return null;

  const body: unknown = error.response?.data;
  if (typeof body !== "object" || body === null) return null;

  const { message, error: errorText } = body as {
    message?: unknown;
    error?: unknown;
  };
  const text = typeof message === "string" ? message : errorText;
  return typeof text === "string" && text.trim() ? text : null;
};
