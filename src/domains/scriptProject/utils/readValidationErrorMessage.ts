import axios from "axios";

const HTTP_UNPROCESSABLE_CONTENT = 422;

/** The backend's own words for a rejected edit, or null when it did not reject one.
 *
 * A shot's tags are capped at 12 characters and 20 props, and the `422` names both the cap and
 * the count. A generic "could not save" would throw that away and leave the user guessing which
 * limit they hit. */
export const readValidationErrorMessage = (error: unknown): string | null => {
  if (!axios.isAxiosError(error)) return null;
  if (error.response?.status !== HTTP_UNPROCESSABLE_CONTENT) return null;

  const body: unknown = error.response.data;
  if (typeof body !== "object" || body === null) return null;

  const message = (body as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message : null;
};
