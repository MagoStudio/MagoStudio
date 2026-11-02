import { asRecord } from "./asRecord";

export const promptQueueContains = (
  queue: unknown,
  promptId: string
): boolean =>
  Array.isArray(queue) &&
  queue.some((item) =>
    Array.isArray(item)
      ? item[1] === promptId
      : asRecord(item)?.prompt_id === promptId
  );
