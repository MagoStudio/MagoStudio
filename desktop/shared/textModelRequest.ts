export type TextModelOperation =
  | "casting"
  | "video-prompt"
  | "chat"
  | "describe-sheet-image";

export interface TextModelRequest {
  id: string;
  operation: TextModelOperation;
  body: Record<string, unknown>;
  localProjectId?: string;
}

export interface TextModelResponse {
  id: string;
  /** null selects the existing local model. Errors never silently change route. */
  result?: Record<string, unknown> | null;
  error?: string;
}

export type RunCloudTextModelOptions = {
  isCancelled?: () => boolean;
  localProjectId?: string;
};

export type RunCloudTextModel = (
  operation: TextModelOperation,
  body: Record<string, unknown>,
  options?: RunCloudTextModelOptions
) => Promise<Record<string, unknown> | null>;
