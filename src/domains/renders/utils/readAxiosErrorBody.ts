const ERROR_BODY_MESSAGE_FIELDS = ["detail", "error", "message"] as const;

const readTrimmedText = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const text = value.trim();
  const isHtmlErrorPage = text.startsWith("<");
  return isHtmlErrorPage ? "" : text;
};

const readNestedMessage = (value: unknown): string => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return "";
  }
  const nested = value as Record<string, unknown>;
  return readTrimmedText(nested.message) || readTrimmedText(nested.detail);
};

export const readAxiosErrorBody = (data: unknown): string => {
  if (typeof data === "string") return readTrimmedText(data);
  if (typeof data !== "object" || data === null) return "";
  const record = data as Record<string, unknown>;
  for (const field of ERROR_BODY_MESSAGE_FIELDS) {
    const message = readTrimmedText(record[field]);
    if (message) return message;
  }
  for (const field of ERROR_BODY_MESSAGE_FIELDS) {
    const message = readNestedMessage(record[field]);
    if (message) return message;
  }
  return "";
};
