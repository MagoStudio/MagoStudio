const MAX_DISPLAY_ERROR_LENGTH = 500;

type JsonRecord = Record<string, unknown>;

const record = (value: unknown): JsonRecord | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const truncate = (value: string): string =>
  value.length > MAX_DISPLAY_ERROR_LENGTH
    ? `${value.slice(0, MAX_DISPLAY_ERROR_LENGTH - 1)}…`
    : value;

const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const findExecutionError = (value: unknown): JsonRecord | null => {
  if (Array.isArray(value)) {
    if (value[0] === "execution_error") return record(value[1]);
    for (let index = value.length - 1; index >= 0; index -= 1) {
      const found = findExecutionError(value[index]);
      if (found) return found;
    }
  }
  const item = record(value);
  if (!item) return null;
  if (text(item.exception_message) || text(item.exception_type)) return item;
  for (const child of Object.values(item)) {
    const found = findExecutionError(child);
    if (found) return found;
  }
  return null;
};

const firstNodeError = (
  value: unknown
): { nodeId: string; node: JsonRecord; error: JsonRecord } | null => {
  const nodes = record(value);
  if (!nodes) return null;
  for (const [nodeId, nodeValue] of Object.entries(nodes)) {
    const node = record(nodeValue);
    const errors = node && Array.isArray(node.errors) ? node.errors : [];
    const error = record(errors[0]);
    if (node && error) return { nodeId, node, error };
  }
  return null;
};

const isModelInput = (inputName: string): boolean =>
  /(?:^|_)(?:model|unet|ckpt|vae|clip|lora)(?:_|$)/i.test(inputName) &&
  /name/i.test(inputName);

export const isComfyOutOfMemoryError = (value: string): boolean =>
  /out of (?:gpu )?memory|OutOfMemoryError|CUDA error: out of memory/i.test(
    value
  );

/** Turns ComfyUI prompt-validation and execution payloads into safe UI text. */
export const formatComfyError = (input: unknown): string => {
  const value = parseJson(input);
  const execution = findExecutionError(value);
  if (execution) {
    const exception =
      text(execution.exception_message) ??
      text(execution.exception_type) ??
      "Unknown execution error";
    const nodeType = text(execution.node_type);
    if (
      isComfyOutOfMemoryError(
        `${text(execution.exception_type) ?? ""} ${exception}`
      )
    ) {
      return truncate(
        `ComfyUI ran out of GPU memory${nodeType ? ` while running ${nodeType}` : ""}. Reduce the output size or select a smaller model.`
      );
    }
    return truncate(
      `ComfyUI failed${nodeType ? ` in ${nodeType}` : ""}: ${exception}`
    );
  }

  const root = record(value);
  const nodeFailure = firstNodeError(root?.node_errors);
  if (nodeFailure) {
    const nodeType =
      text(nodeFailure.node.class_type) ?? `node ${nodeFailure.nodeId}`;
    const details = text(nodeFailure.error.details);
    const message = text(nodeFailure.error.message) ?? "Invalid input";
    const extra = record(nodeFailure.error.extra_info);
    const inputName = text(extra?.input_name);
    const receivedValue = text(extra?.received_value);
    if (
      nodeFailure.error.type === "value_not_in_list" &&
      inputName &&
      receivedValue &&
      isModelInput(inputName)
    ) {
      return truncate(
        `ComfyUI cannot find model file "${receivedValue}" for ${nodeType}. Install it in the expected ComfyUI models folder, then refresh or restart ComfyUI.`
      );
    }
    return truncate(
      `ComfyUI rejected the workflow in ${nodeType}: ${details ?? message}`
    );
  }

  const rootError = record(root?.error);
  const rootMessage =
    text(rootError?.message) ?? text(root?.message) ?? text(root?.error);
  if (rootMessage)
    return truncate(`ComfyUI rejected the workflow: ${rootMessage}`);
  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
      const message = text(value[index]);
      if (message) return truncate(`ComfyUI failed: ${message}`);
    }
  }
  if (typeof value === "string" && value.trim())
    return truncate(`ComfyUI error: ${value.trim()}`);
  return "ComfyUI failed with an unknown error";
};

export const formatComfyHttpError = (
  status: number,
  statusText: string,
  body: string
): string => {
  if (body.trim()) return formatComfyError(body);
  return `ComfyUI request failed (${status}): ${statusText || "Request rejected"}`;
};
