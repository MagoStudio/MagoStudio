import { getInQueueStatusText } from "@domains/queue/utils/getInQueueStatusText";

type TranslationFunction = (key: string) => string;

export const getQueueStatusLabel = (
  positionInQueue: number | undefined,
  t?: TranslationFunction
): string | undefined => {
  if (positionInQueue === undefined) {
    return undefined;
  }

  if (positionInQueue === 0) {
    return t ? t("status.in_queue_next.label") : "In Queue: Next";
  }

  return getInQueueStatusText(positionInQueue);
};
