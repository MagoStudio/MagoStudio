import axios from "axios";

const HTTP_BAD_REQUEST = 400;

export const readProjectSettingsRejectionMessage = (
  error: unknown
): string | null => {
  if (!axios.isAxiosError(error)) return null;
  if (error.response?.status !== HTTP_BAD_REQUEST) return null;

  const body: unknown = error.response.data;
  if (typeof body !== "object" || body === null) return null;

  const message = (body as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message : null;
};
