import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useLoadNextPageWhileSentinelVisible } from "./useLoadNextPageWhileSentinelVisible";

const renderNextPageLoading = (
  overrides: Partial<
    Parameters<typeof useLoadNextPageWhileSentinelVisible>[0]
  > = {}
) => {
  const fetchNextPage = vi.fn(() => Promise.resolve());
  const initialProps = {
    isLoadMoreSentinelVisible: true,
    hasNextPage: true,
    isFetchingAnyPage: false,
    fetchNextPage,
    ...overrides
  };
  const rendered = renderHook(
    (props: typeof initialProps) => useLoadNextPageWhileSentinelVisible(props),
    { initialProps }
  );
  return { ...rendered, fetchNextPage, initialProps };
};

describe("useLoadNextPageWhileSentinelVisible", () => {
  it("loads the next page while the sentinel is visible", () => {
    const { fetchNextPage } = renderNextPageLoading();

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("waits while any page is loading, then loads once it settles", () => {
    const { fetchNextPage, rerender, initialProps } = renderNextPageLoading({
      isFetchingAnyPage: true
    });
    expect(fetchNextPage).not.toHaveBeenCalled();

    rerender({ ...initialProps, isFetchingAnyPage: false });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("keeps loading page after page while the sentinel stays visible", () => {
    const { fetchNextPage, rerender, initialProps } = renderNextPageLoading();

    rerender({ ...initialProps, isFetchingAnyPage: true });
    rerender({ ...initialProps, isFetchingAnyPage: false });

    expect(fetchNextPage).toHaveBeenCalledTimes(2);
  });

  it("does nothing when the sentinel is off screen", () => {
    const { fetchNextPage } = renderNextPageLoading({
      isLoadMoreSentinelVisible: false
    });

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("stops after the last page", () => {
    const { fetchNextPage } = renderNextPageLoading({ hasNextPage: false });

    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
