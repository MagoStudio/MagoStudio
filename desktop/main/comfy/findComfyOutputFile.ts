import { asRecord } from "./asRecord";
import type { ComfyFileReference } from "./comfyFileReference";

const findFileReferenceIn = (value: unknown): ComfyFileReference | null => {
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findFileReferenceIn(child);
      if (found) return found;
    }
    return null;
  }
  const record = asRecord(value);
  if (!record) return null;
  if (typeof record.filename === "string") {
    return {
      filename: record.filename,
      subfolder:
        typeof record.subfolder === "string" ? record.subfolder : undefined,
      type: typeof record.type === "string" ? record.type : undefined
    };
  }
  for (const child of Object.values(record)) {
    const found = findFileReferenceIn(child);
    if (found) return found;
  }
  return null;
};

export const findComfyOutputFile = (
  outputs: Record<string, unknown>,
  outputNodeId: string
): ComfyFileReference | null => findFileReferenceIn(outputs[outputNodeId]);
