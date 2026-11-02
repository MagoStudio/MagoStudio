export type TextModelOperation = "casting" | "video-prompt" | "chat";

export interface TextModelRequest {
  id: string;
  operation: TextModelOperation;
  body: Record<string, unknown>;
}

export interface TextModelResponse {
  id: string;
  /** null selects the existing local model. Errors never silently change route. */
  result?: Record<string, unknown> | null;
  error?: string;
}

export type RunCloudTextModel = (
  operation: TextModelOperation,
  body: Record<string, unknown>,
  isCancelled?: () => boolean
) => Promise<Record<string, unknown> | null>;
