/* oxlint-disable custom-react/no-use-effect -- legitimate external sync: the sentinel's visibility comes from an IntersectionObserver, and loading the next page answers it */
import { useEffect } from "react";

type NextPageLoading = {
  isLoadMoreSentinelVisible: boolean;
  hasNextPage: boolean;
  isFetchingAnyPage: boolean;
  fetchNextPage: () => Promise<unknown>;
};

export const useLoadNextPageWhileSentinelVisible = ({
  isLoadMoreSentinelVisible,
  hasNextPage,
  isFetchingAnyPage,
  fetchNextPage
}: NextPageLoading) => {
  const shouldLoadNextPage =
    isLoadMoreSentinelVisible && hasNextPage && !isFetchingAnyPage;

  /* oxlint-disable react-you-might-not-need-an-effect/no-event-handler -- visibility changes arrive from the observer, not from a user event this page could handle */
  useEffect(() => {
    if (!shouldLoadNextPage) return;
    void fetchNextPage();
  }, [shouldLoadNextPage, fetchNextPage]);
  /* oxlint-enable react-you-might-not-need-an-effect/no-event-handler */
};
