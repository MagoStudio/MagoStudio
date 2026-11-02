export interface HistoryMutationRecord {
  method: "pushState" | "replaceState";
  url: string;
  stackTop: string;
}

export const MAX_HISTORY_MUTATION_RECORDS = 10;

export const extractStackTop = (stack: string | undefined): string => {
  if (!stack) return "unknown";
  const frames = stack
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("at "));
  const caller = frames.find(
    (frame) =>
      !frame.includes("historyMutationLog") &&
      !frame.includes("installHistoryMutationObserver")
  );
  return caller ?? frames[0] ?? "unknown";
};

export const appendMutationRecord = (
  buffer: HistoryMutationRecord[],
  record: HistoryMutationRecord,
  max: number = MAX_HISTORY_MUTATION_RECORDS
): HistoryMutationRecord[] => [...buffer, record].slice(-max);

export const parseMutationLog = (
  raw: string | null
): HistoryMutationRecord[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryMutationRecord[]) : [];
  } catch {
    return [];
  }
};

export const serializeMutationLog = (buffer: HistoryMutationRecord[]): string =>
  JSON.stringify(buffer);
