import {
  findRendersThatJustEnded,
  RenderSnapshot,
  toRenderSnapshots
} from "@domains/queue/utils/findRendersThatJustEnded";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { MutableRefObject, useEffect, useRef } from "react";

import { QueueItem } from "./interface";
import { invalidateCachesForEndedRenders } from "./invalidateCachesForEndedRenders";
import { useQueue } from "./useQueue";

const refreshCachesForRendersThatEndedSinceLastPoll = ({
  queueItems,
  rendersAtPreviousPollRef,
  queryClient
}: {
  queueItems: QueueItem[];
  rendersAtPreviousPollRef: MutableRefObject<
    Map<string, RenderSnapshot> | undefined
  >;
  queryClient: QueryClient;
}) => {
  const rendersAtThisPoll = toRenderSnapshots(queueItems);
  const rendersAtPreviousPoll = rendersAtPreviousPollRef.current;
  rendersAtPreviousPollRef.current = rendersAtThisPoll;

  const isFirstPoll = rendersAtPreviousPoll === undefined;
  if (isFirstPoll) return;

  const endedRenders = findRendersThatJustEnded({
    previousRenders: rendersAtPreviousPoll,
    currentRenders: rendersAtThisPoll
  });
  if (endedRenders.length === 0) return;

  invalidateCachesForEndedRenders({ queryClient, endedRenders });
};

export const useInvalidateCachesWhenRendersEnd = () => {
  const queryClient = useQueryClient();
  const { data: queueItems } = useQueue();
  const rendersAtPreviousPollRef = useRef<
    Map<string, RenderSnapshot> | undefined
  >(undefined);

  // oxlint-disable-next-line custom-react/no-use-effect -- reacts to each queue poll, whose arrival React only exposes as changed data
  useEffect(() => {
    if (!queueItems) return;
    refreshCachesForRendersThatEndedSinceLastPoll({
      queueItems,
      rendersAtPreviousPollRef,
      queryClient
    });
  }, [queueItems, queryClient]);
};
